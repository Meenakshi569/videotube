import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ✅ Toggle subscription (subscribe/unsubscribe)
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    if (channelId.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself")
    }

    const existingSub = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    })

    if (existingSub) {
        await existingSub.deleteOne()
        return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed successfully"))
    }

    const subscription = await Subscription.create({
        channel: channelId,
        subscriber: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, subscription, "Subscribed successfully"))
})

// ✅ Get subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username email")

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    )
})

// ✅ Get channels a user has subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId")
    }

    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username email")

    return res.status(200).json(
        new ApiResponse(200, subscriptions.map(sub => sub.channel), "Subscribed channels fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
