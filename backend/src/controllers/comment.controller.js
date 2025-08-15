import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ✅ Get all comments for a video (with pagination)
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const skip = (page - 1) * limit

    const comments = await Comment.find({ video: videoId })
        .populate("user", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))

    const total = await Comment.countDocuments({ video: videoId })

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        }, "Comments fetched successfully")
    )
})

// ✅ Add a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const comment = await Comment.create({
        video: videoId,
        user: req.user._id, // assuming you attach user in auth middleware
        content
    })

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment added successfully")
    )
})

// ✅ Update a comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // Only owner can update
    if (comment.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to update this comment")
    }

    comment.content = content || comment.content
    await comment.save()

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    )
})

// ✅ Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // Only owner can delete
    if (comment.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to delete this comment")
    }

    await comment.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
