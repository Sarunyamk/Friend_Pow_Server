const prisma = require("../configs/prisma");
const createError = require("../utils/createError");
const cloudinary = require("../configs/cloudinary");
const fs = require("fs/promises");
const path = require("path");

exports.eventShowPages = async (req, res) => {
  // const language = req.headers['accept-language'] || 'en';
  // const titleField = language === 'th' ? 'title_th' : 'title_en';
  // const descriptionField = language === 'th' ? 'description_th' : 'description_en';

  try {
    const today = new Date();
    const allEvent = await prisma.events.findMany({
      where: {
        OR: [{ status: "ACTIVE" }, { status: "PENDING" }],
        deleted_at: null,
      },
      include: {
        image: true,
      },
    });
    const pastEvent = await prisma.events.findMany({
      where: {
        date_start: {
          lte: today,
        },
        status: "COMPLETED",
        deleted_at: null,
      },
      select: {
        id: true,
        location: true,
        date_start: true,
        date_end: true,
        title_en: true,
        title_th: true,
        description_en: true,
        description_th: true,
        // [titleField]: true,
        // [descriptionField]: true,
        image: { select: { url: true } },
      },
    });
    const events = await prisma.events.findMany({
      where: {
        date_start: {
          gte: today,
        },
        status: "ACTIVE",
        deleted_at: null,
      },
      select: {
        id: true,
        location: true,
        date_start: true,
        date_end: true,
        title_en: true,
        title_th: true,
        description_en: true,
        description_th: true,
        // [titleField]: true,
        // [descriptionField]: true,
        image: { select: { url: true } },
      },
      orderBy: {
        date_start: "asc",
      }
    });
    // const formattedPastEvent = pastEvent.map(event => ({
    //     ...event,
    //     title: event[titleField],
    //     description: event[descriptionField],
    // }));
    // const formattedEvent = events.map(event => ({
    //     ...event,
    //     title: event[titleField],
    //     description: event[descriptionField],
    // }));
    // res.status(200).json({ events: formattedEvent, pastEvent: formattedPastEvent, allEvent });
    res.status(200).json({ events, pastEvent, allEvent });
  } catch (error) {
    res.status(500).json({ message: "eventShowPages error", error: error.message });
  }
};

exports.regisEvent = async (req, res, next) => {
  try {
    const userId = req.user;
    const { eventId } = req.body;
    const event = await prisma.events.findUnique({
      where: {
        id: +eventId.eventId,
      },
    });
    console.log("event", event);
    if (!event) {
      return createError(400, "event not found");
    }
    const haveRegis = await prisma.eventAttendees.findFirst({
      where: {
        userId: +userId.id,
        eventId: +eventId.eventId,
      },
    });
    console.log("haveRegis", haveRegis);
    if (haveRegis) {
      return createError(400, "ลงทะเบียนล่วงหน้าเรียบร้อยแล้ว");
    }
    console.log("----", event);
    const regisEvent = await prisma.eventAttendees.create({
      data: {
        userId: +userId.id,
        eventId: +eventId.eventId,
      },
    });
    console.log("regisEvent--->", regisEvent);
    res.status(200).json({ message: "regisEvent success", regisEvent });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const { title_en, title_th, date_start, date_end, description_en, description_th, location } =
      req.body;
    console.log("req.body", req.body);

    // ตรวจสอบสิทธิ์การเข้าถึง
    if (req.user.role !== "ADMIN") {
      return res.status(400).json({ message: "Unauthorized" });
    }

    // ตรวจสอบว่ามีไฟล์อัปโหลดมาหรือไม่
    const hasFile = !!req.file;
    let uploadResult = {};
    console.log("hasFile", hasFile);

    if (hasFile) {
      // อัปโหลดไฟล์ไปที่ Cloudinary
      uploadResult = await cloudinary.uploader.upload(req.file.path, {
        overwrite: true,
        public_id: path.parse(req.file.path).name,
      });
      // ลบไฟล์ออกจากเครื่องหลังอัปโหลดสำเร็จ
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error removing file:", err);
      });
    }

    // สร้างข้อมูล event ใหม่
    const newEvent = await prisma.events.create({
      data: {
        title_en,
        title_th,
        description_en,
        description_th,
        date_start: new Date(date_start),
        date_end: new Date(date_end),
        location,
        image: {
          create: hasFile ? { url: uploadResult.secure_url || "" } : [],
        },
      },
      include: {
        image: true,
      },
    });

    res.status(200).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (err) {
    console.error("Error creating event:", err);
    next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log("ขอดู ID", id);
    const event = await prisma.events.findUnique({
      where: {
        id: +id,
      },
    });
    console.log(event);
    if (!event) {
      return res.status(404).json({ message: "Event---- not found" });
    }
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (req.user.role !== "ADMIN") {
      return res.status(400).json({ message: "Unauthorized" });
    }
    // ลบ event
    await prisma.events.update({
      where: {
        id: +id,
      },
      data: {
        deleted_at: new Date(),
      },
    });
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { title_en, title_th, description_en, description_th, date_start, date_end, location, status } =
      req.body;

    const event = await prisma.events.findUnique({
      where: {
        id: +id,
        deleted_at: null,
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const updatedEvent = await prisma.events.update({
      where: {
        id: +id,
      },
      data: {
        title_en,
        title_th,
        description_en,
        description_th,
        date_start: new Date(date_start),
        date_end: new Date(date_end),
        location,
        status,
      },
    });

    res.status(200).json({ message: "Event updated successfully", data: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "An error occurred while updating the event" });
    next(error);
  }
};