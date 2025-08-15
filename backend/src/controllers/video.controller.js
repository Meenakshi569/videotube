import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

// Get all videos (with query, sort, pagination)
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const filter = {};
    if (query) {
        filter.title = { $regex: query, $options: "i" };
    }
    if (userId) {
        filter.owner = userId;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortType === "asc" ? 1 : -1 };

    const videos = await Video.find(filter)
        .populate("owner", "username email")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Video.countDocuments(filter);

    res.status(200).json({
        success: true,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalVideos: total,
        videos
    });
});

// Publish/upload a video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!req.file) {
        return res.status(400).json({ success: false, message: "Video file is required" });
    }

    // Upload to Cloudinary
    const uploadedVideo = await uploadOnCloudinary(req.file.path, "video");
    if (!uploadedVideo) {
        return res.status(500).json({ success: false, message: "Error uploading video" });
    }

    const video = await Video.create({
        title,
        description,
        url: uploadedVideo.secure_url,
        public_id: uploadedVideo.public_id,
        owner: req.user._id
    });

    res.status(201).json({
        success: true,
        message: "Video published successfully",
        video
    });
});

// Get video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId).populate("owner", "username email");
    if (!video) {
        return res.status(404).json({ success: false, message: "Video not found" });
    }

    res.status(200).json({ success: true, video });
});

// Update video
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, thumbnail } = req.body;

    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ success: false, message: "Video not found" });
    }

    if (title) video.title = title;
    if (description) video.description = description;
    if (thumbnail) video.thumbnail = thumbnail;

    await video.save();

    res.status(200).json({ success: true, message: "Video updated successfully", video });
});

// Delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ success: false, message: "Video not found" });
    }

    // Optional: remove from Cloudinary
    // await deleteFromCloudinary(video.public_id);

    await video.deleteOne();

    res.status(200).json({ success: true, message: "Video deleted successfully" });
});

// Toggle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ success: false, message: "Video not found" });
    }

    video.isPublished = !video.isPublished;
    await video.save();

    res.status(200).json({
        success: true,
        message: `Video is now ${video.isPublished ? "published" : "unpublished"}`,
        video
    });
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}