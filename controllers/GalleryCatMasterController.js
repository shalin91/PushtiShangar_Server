const gallaryCategoryModel = require("../models/GalleryCategory");
// const appError = require("../utils/appError");
// const catchAsync = require("../utils/catchAsync");

exports.getGallaryCategories = async (req, res, next) => {
  const GalleryCat = await gallaryCategoryModel.find({ deleted: false }).lean();
  if (GalleryCat.length === 0) {
    return res.end();
  }
  return res.send({ GalleryCat });
};

exports.addNewGallaryCategory = async (req, res, next) => {
  const body = {
    gallaryCategoryTitle: req.body.gallaryCategoryTitle,
    description: req.body.description,
    imagePath: req.file ? req.file.filename : "",
  };
  const ItemIsUnique =
    (await gallaryCategoryModel.find({
        gallaryCategoryTitle: req.body.gallaryCategoryTitle,
      deleted: false,
    }).count()) === 0;
  if (ItemIsUnique) {
    const newRecordAdded = await gallaryCategoryModel.create(body);
    res.send({
      success : true,
      data: newRecordAdded,
      message: "image added in gallary added successfully",
    });
  } else {
    return res.send({ error: "Content not found" });
  }
};

exports.getGallaryCatById = async (req, res, next) => {

  const galleryId = req.params.id;
  const recordExists = await gallaryCategoryModel.findById(galleryId);
  if (!recordExists || recordExists.deleted) {
    return res.send({ error: "Content not found" });
  } else {
    res.send({ success: true ,  recordExists });
  }
};

exports.updateGallaryCat = async (req, res, next) => {
  const GallaryId = req.params.id;
  const RecordToUpdate = await gallaryCategoryModel.findById(GallaryId);

  if (!RecordToUpdate || RecordToUpdate.deleted) {
    return res.send({ error: "Content not found" });
  }
  const updateData = {
    gallaryCategoryTitle: req.body.gallaryCategoryTitle,
    description: req.body.description,
    active:req.body.active,
    updatedAt: Date.now(),
  };

  if (req.file) {
    updateData.imagePath = req.file.filename;
  }
  await gallaryCategoryModel.findByIdAndUpdate(GallaryId, updateData);
  const updatedRecord = await gallaryCategoryModel.findById(GallaryId);
  res.send({
    success : true,
    message: "Record updated successfully",
    updatedRecord,
  });
};

exports.deleteGallaeyCat = async (req, res, next) => {
  const record = await gallaryCategoryModel.findByIdAndDelete(
    req.params.id,
  );

  if (!record) {
    return res.send({ message: "record not found" });
  }

  return res.send({success : true, message: "Successfully Deleted"});
};

exports.getAllIncDel = async (req, res, next) => {
  const recordExists = await gallaryCategoryModel.find().lean();

  if (recordExists.length === 0) {
    return res.status(204).end();
  }

  return res.status(200).json({ data: recordExists });
};