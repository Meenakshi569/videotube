import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ✅ Get channel stats (views, subs, videos, likes)
const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id // assuming channel = user

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    // total videos
    const totalVideos = await Video.countDocuments({ owner: channelId })

    // total views
    const viewsAgg = await Video.aggregate([
        { $match: { owner: channelId } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ])
    const totalViews = viewsAgg.length > 0 ? viewsAgg[0].totalViews : 0

    // total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId })

    // total likes on channel videos
    const channelVideos = await Video.find({ owner: channelId }).select("_id")
    const videoIds = channelVideos.map(v => v._id)
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } })

    return res.status(200).json(
        new ApiResponse(200, {
            totalVideos,
            totalViews,
            totalSubscribers,
            totalLikes
        }, "Channel stats fetched successfully")
    )
})

// ✅ Get all videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const videos = await Video.find({ owner: channelId })
        .sort({ createdAt: -1 })
        .populate("owner", "username email")

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    )
})

export {
    getChannelStats,
    getChannelVideos
}
