const prisma = require("../configs/prisma");
const cloudinary = require("../configs/cloudinary");

const adminAboutPageController = {
  // ฟังก์ชันดึงข้อมูล AboutContent
  getAboutContent: async (req, res) => {
    try {
      const aboutContent = await prisma.aboutContent.findMany(); // ใช้ Prisma ดึงข้อมูล
      res.status(200).json(aboutContent);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ฟังก์ชันสร้างข้อมูลใหม่ใน AboutContent
  createAboutContent: async (req, res) => {
    try {
      const { video_url, header_en, header_th, description_en, description_th, 
              help_title_en, help_title_th, help_content_en, help_content_th } = req.body;
      const files = req.files;

      // อัพโหลดภาพไปที่ Cloudinary
      const imageResult = await cloudinary.uploader.upload(files.image[0].path, {
        folder: "aboutpage",
      });

      const newContent = await prisma.aboutContent.create({
        data: {
          video_url,
          header_en,
          header_th,
          description_en,
          description_th,
          help_title_en,
          help_title_th,
          help_content_en,
          help_content_th,
          image: imageResult.secure_url, // เก็บ URL ของภาพที่อัพโหลด
        },
      });

      res.status(201).json(newContent);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ฟังก์ชันอัพเดทข้อมูล AboutContent
  updateAboutContent: async (req, res) => {
    try {
      const { id } = req.params;
      const { video_url, header_en, header_th, description_en, description_th, 
              help_title_en, help_title_th, help_content_en, help_content_th } = req.body;
      const files = req.files;

      let updateData = {};

      // อัปโหลดภาพไปที่ Cloudinary หากมีการอัปโหลดไฟล์ภาพ
      if (files) {
        if (files.image) {
          const imageResult = await cloudinary.uploader.upload(files.image[0].path, {
            folder: "aboutpage",
          });
          updateData.image = imageResult.secure_url;
        }
      }

      // เพิ่มการอัปเดตข้อมูลอื่นๆ ถ้ามี
      if (video_url) updateData.video_url = video_url;
      if (header_en) updateData.header_en = header_en;
      if (header_th) updateData.header_th = header_th;
      if (description_en) updateData.description_en = description_en;
      if (description_th) updateData.description_th = description_th;
      if (help_title_en) updateData.help_title_en = help_title_en;
      if (help_title_th) updateData.help_title_th = help_title_th;
      if (help_content_en) updateData.help_content_en = help_content_en;
      if (help_content_th) updateData.help_content_th = help_content_th;

      const updatedContent = await prisma.aboutContent.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      res.status(200).json(updatedContent);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = adminAboutPageController;
