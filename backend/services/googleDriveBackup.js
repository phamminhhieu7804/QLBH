import exceljs from 'exceljs';
import { google } from 'googleapis';
import stream from 'stream';

// Lấy thông tin chứng chỉ từ môi trường (Biến môi trường)
const getDriveAuth = () => {
    try {
        if (!process.env.GOOGLE_DRIVE_CREDENTIALS) return null;
        
        // Parse chuỗi JSON credentials thành đối tượng cấu hình
        const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        return google.drive({ version: 'v3', auth });
    } catch (error) {
        console.error('[Google Drive Backup] Lỗi parse chứng chỉ từ GOOGLE_DRIVE_CREDENTIALS:', error.message);
        return null;
    }
};

// Hàm đóng gói dữ liệu của Quán ăn thành file Excel (.xlsx) Buffer
const buildExcelBuffer = async (tenantCode, data) => {
    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet('Cấu hình Quán ăn');
    
    // Định nghĩa cột
    sheet.columns = [
        { header: 'Thuộc tính', key: 'key', width: 30 },
        { header: 'Giá trị', key: 'value', width: 50 }
    ];
    
    // Đổ dữ liệu vào các dòng
    sheet.addRow({ key: 'Mã quán (Tenant Code)', value: tenantCode });
    sheet.addRow({ key: 'Tên quán', value: data.name || '' });
    sheet.addRow({ key: 'Địa chỉ', value: data.address || '' });
    sheet.addRow({ key: 'Vốn đầu tư ban đầu', value: data.config?.initialInvestment || 'Chưa cấu hình' });
    sheet.addRow({ key: 'Tỷ suất lợi nhuận kỳ vọng (%)', value: data.config?.targetProfitMargin || 'Chưa cấu hình' });
    sheet.addRow({ key: 'Ngân hàng', value: data.bankFullName || data.bankId || 'Chưa liên kết' });
    sheet.addRow({ key: 'Số tài khoản', value: data.bankAccountNo || '' });
    sheet.addRow({ key: 'Tên chủ tài khoản', value: data.bankAccountName || '' });
    sheet.addRow({ key: 'Ngày sao lưu', value: new Date().toLocaleString('vi-VN') });
    
    // Bôi đậm dòng tiêu đề
    sheet.getRow(1).font = { bold: true };
    
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};

// Upload và Chia sẻ quyền (Share)
const uploadAndShareToDrive = async (drive, buffer, filename, emails) => {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID; // Thư mục lưu trữ trung tâm của hệ thống (tuỳ chọn)
    
    // 1. Tạo luồng dữ liệu (Stream) từ Buffer
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    
    const fileMetadata = {
        name: filename,
        parents: folderId ? [folderId] : []
    };
    
    const media = {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: bufferStream
    };
    
    // 2. Upload file lên Drive của Service Account
    const uploadRes = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id'
    });
    
    const fileId = uploadRes.data.id;
    console.log(`[Google Drive Backup] Đã upload file Excel thành công! ID: ${fileId}`);
    
    // 3. Share file cho danh sách Gmail của Chủ quán (Quyền Editor)
    if (emails && emails.length > 0) {
        for (const email of emails) {
            try {
                await drive.permissions.create({
                    fileId: fileId,
                    requestBody: {
                        role: 'writer',
                        type: 'user',
                        emailAddress: email
                    },
                    fields: 'id'
                });
                console.log(`[Google Drive Backup] Đã Share quyền truy cập file cho Gmail: ${email}`);
            } catch (shareErr) {
                console.error(`[Google Drive Backup] Lỗi khi share quyền cho email ${email}:`, shareErr.message);
            }
        }
    }
};

// Hàm Wrapper chạy ngầm (Background Job)
export const runBackgroundBackup = async (tenantCode, restaurantData) => {
    try {
        const emails = restaurantData.config?.backupEmails || [];
        
        const drive = getDriveAuth();
        if (!drive) {
            return; // Im lặng bỏ qua nếu Admin Server chưa cấu hình Credentials
        }
        
        console.log(`[Google Drive Backup] Đang tiến hành tạo file sao lưu cho quán: ${tenantCode}...`);
        
        // Tạo file
        const buffer = await buildExcelBuffer(tenantCode, restaurantData);
        const filename = `backup_${tenantCode}_${Date.now()}.xlsx`;
        
        // Đẩy lên và Share
        await uploadAndShareToDrive(drive, buffer, filename, emails);
        
        console.log(`[Google Drive Backup] Hoàn tất quá trình sao lưu tự động cho ${tenantCode}.`);
    } catch (error) {
        // Bắt mọi lỗi để không crash ứng dụng chính (Ví dụ: đứt mạng khi upload)
        console.error('[Google Drive Backup] Lỗi trong quá trình chạy ngầm:', error.message);
    }
};
