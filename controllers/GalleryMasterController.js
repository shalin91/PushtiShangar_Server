const gallaryMasterModel = require("../models/GalleryDetails");
// const appError = require("../utils/appError");
// const catchAsync = require("../utils/catchAsync");

exports.getGallaryItems = async (req, res, next) => {
  const recordExists = await gallaryMasterModel.find({ deleted: false });
  if (recordExists.length === 0) {
    return res.end();
  }
  return res.send({ data: recordExists });
};

exports.addNewImageInGallary = async (req, res, next) => {
  const body = {
    imageTitle: req.body.imageTitle,
    description: req.body.description,
    galleryCategory:req.body.galleryCategory,
    imagePath: req.file ? req.file.filename : "",
    active : req.body.active,
  };
  console.log(body);
  const ItemIsUnique =
    (await gallaryMasterModel.find({
        imageTitle: req.body.imageTitle,
      deleted: false,
    }).count()) === 0;
  if (ItemIsUnique) {
    const newRecordAdded = await gallaryMasterModel.create(body);
    res.send({
      success : true,
      data: newRecordAdded,
      message: "image added in gallary added successfully",
    });
  } else {
    return res.send({ error: "Content not found" });
  }
};

exports.getGallaryItemById = async (req, res, next) => {
  const recordExists = await gallaryMasterModel.findById(req.params.id);
  if (!recordExists || recordExists.deleted) {
    return res.send({ error: "Content not found" });
  } else {
    res.send({ success : true , recordExists });
  }
};

exports.updateGallaryItem = async (req, res, next) => {
  const GallaryId = req.params.id;
  const RecordToUpdate = await gallaryMasterModel.findById(GallaryId);

  if (!RecordToUpdate || RecordToUpdate.deleted) {
    return res.send({ error: "Content not found" });
  }
  const updateData = {
    imageTitle: req.body.imageTitle,
    description: req.body.description,
    galleryCategory:req.body.galleryCategory,
    active:req.body.active,
    updatedAt: Date.now(),
  };

  if (req.file) {
    updateData.imagePath = req.file.filename;
  }
  await gallaryMasterModel.findByIdAndUpdate(GallaryId, updateData);
  const updatedRecord = await gallaryMasterModel.findById(GallaryId);
  res.send({
    success : true,
    message: "Record updated successfully",
    data: updatedRecord,
  });
};

exports.deleteGalleryItem = async (req, res, next) => {
  const record = await gallaryMasterModel.findByIdAndDelete(
    req.params.id,
  );

  if (!record) {
    return res.send({ message: "record not found" });
  }

  return res.send({success : true, message: "Successfully Deleted"});
};

exports.getAllIncDel = async (req, res, next) => {
  const recordExists = await gallaryMasterModel.find().lean();

  if (recordExists.length === 0) {
    return res.send();
  }

  return res.send({success : true,  data: recordExists });
};