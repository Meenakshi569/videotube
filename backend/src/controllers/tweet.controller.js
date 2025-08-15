import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ✅ Create a tweet
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required")
    }

    const tweet = await Tweet.create({
        content,
        user: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, tweet, "Tweet created successfully")
    )
})

// ✅ Get all tweets of a user
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const tweets = await Tweet.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate("user", "username email")

    return res.status(200).json(
        new ApiResponse(200, tweets, "User tweets fetched successfully")
    )
})

// ✅ Update a tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    // Only owner can update
    if (tweet.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to update this tweet")
    }

    tweet.content = content || tweet.content
    await tweet.save()

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    )
})

// ✅ Delete a tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to delete this tweet")
    }

    await tweet.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
