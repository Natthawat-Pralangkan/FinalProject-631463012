//นี่คือสคริปต์ฝั่งเซิร์ฟเวอร์ Node.js ที่ใช้
//ไลบรารี Express และ Socket.io เพื่อสร้างแบบเรียลไทม์
//แอปพลิเคชั่นวิดีโอแชท WebRTC 


///บรรทัดเหล่านี้นำเข้าไลบรารี Express และ uuidและสร้างอินสแตนซ์ของแอปพลิเคชัน Express และเซิร์ฟเวอร์ HTTP 
const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");

/// บรรทัดนี้นำเข้าโมดูล ExpressPeerServer จากไลบรารีเพียร์ และบรรทัดถัดไปสร้างออบเจกต์ตัวเลือกที่มีคุณสมบัติการดีบัก
/// ตั้งค่าเป็นจริง
const { ExpressPeerServer } = require("peer");
const opinions = {
    debug: true,
}
// บรรทัดนี้ตั้งค่าเอนจินการดูสำหรับแอปพลิเคชัน Express เป็น EJS และบรรทัดถัดไปนำเข้าไลบรารี Socket.io
//   และแนบกับเซิร์ฟเวอร์ HTTP  คุณสมบัติ cors ใช้เพื่ออนุญาตการเชื่อมต่อจากต้นทางใดๆ 
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
    cors: {
        origin: '*'
    }
});

///  บรรทัดเหล่านี้ติดตั้งมิดเดิลแวร์ ExpressPeerServer บนเส้นทาง /peerjs และให้บริการเนื้อหาของไดเร็กทอรีสาธารณะเป็นสินทรัพย์คงที่
app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

// รหัสนี้สร้างเส้นทางสำหรับ URL รูทและเปลี่ยนเส้นทางผู้ใช้ไปยังรหัสห้องที่สร้างขึ้นแบบสุ่ม สร้างโดย uuidv4() 

app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});


/// รหัสนี้สร้างเส้นทางสำหรับ URL ด้วยพารามิเตอร์ห้องและแสดงมุมมอง room.ejs ด้วยพารามิเตอร์ roomId ที่ส่งผ่านเข้ามา

app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
});


//รหัสนี้ฟังเหตุการณ์ "การเชื่อมต่อ" จากลูกค้า และเมื่อไคลเอนต์เชื่อมต่อ ก็จะฟังเหตุการณ์ "ร่วมห้อง" 
//และเข้าร่วมห้องด้วย roomId ที่แน่นอนปล่อยเหตุการณ์ "เชื่อมต่อกับผู้ใช้" ด้วยรหัสผู้ใช้ที่แน่นอนหลังจาก 1 วินาที ฟังเหตุการณ์ "ข้อความ" ด้วย
//และเมื่อได้รับข้อความส่งข้อความและชื่อผู้ใช้ไปยังลูกค้าทุกคนในห้อง
io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId, userName) => {
        socket.join(roomId);
        setTimeout(() => {
            socket.to(roomId).broadcast.emit("user-connected", userId);
        }, 1000)
        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName);
        });
    });
});

// บรรทัดนี้เริ่มต้นเซิร์ฟเวอร์และฟังพอร์ตที่ระบุในตัวแปรสภาพแวดล้อม PORT หรือพอร์ต 3030 หากไม่ได้ตั้งค่าไว้ */
server.listen(process.env.PORT || 3030);

