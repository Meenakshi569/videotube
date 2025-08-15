import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ✅ Toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const existingLike = await Like.findOne({ video: videoId, user: req.user._id })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200).json(new ApiResponse(200, {}, "Video unliked"))
    }

    const like = await Like.create({
        video: videoId,
        user: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, like, "Video liked"))
})

// ✅ Toggle like on a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    const existingLike = await Like.findOne({ comment: commentId, user: req.user._id })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200).json(new ApiResponse(200, {}, "Comment unliked"))
    }

    const like = await Like.create({
        comment: commentId,
        user: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, like, "Comment liked"))
})

// ✅ Toggle like on a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    const existingLike = await Like.findOne({ tweet: tweetId, user: req.user._id })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200).json(new ApiResponse(200, {}, "Tweet unliked"))
    }

    const like = await Like.create({
        tweet: tweetId,
        user: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, like, "Tweet liked"))
})

// ✅ Get all liked videos by user
const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.find({ user: req.user._id, video: { $exists: true } })
        .populate("video")

    return res.status(200).json(
        new ApiResponse(200, likes.map(like => like.video), "Liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
