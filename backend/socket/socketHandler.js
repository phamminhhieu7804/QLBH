// Module xử lý các sự kiện WebSockets theo thời gian thực (Socket.io)
export const initSocketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Thiết bị mới đã kết nối WebSockets: ID = ${socket.id}`);

    // Cho phép thiết bị tham gia vào các phòng riêng của từng Quán (SaaS Multi-tenant isolation)
    socket.on('join-restaurant', (restaurantId) => {
      socket.join(`restaurant-${restaurantId}`);
      console.log(`Socket ${socket.id} đã tham gia vào phòng Quán: restaurant-${restaurantId}`);
    });

    // Cho phép thiết bị tham gia vào phòng riêng của từng Bàn (Customer QR client)
    socket.on('join-table', (tableId) => {
      socket.join(`table-${tableId}`);
      console.log(`Socket ${socket.id} đã tham gia vào phòng Bàn: table-${tableId}`);
    });

    // Sự kiện ngắt kết nối
    socket.on('disconnect', () => {
      console.log(`Thiết bị ngắt kết nối WebSockets: ID = ${socket.id}`);
    });
  });
};
