import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ✅ Create a new playlist
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name) {
        throw new ApiError(400, "Playlist name is required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    )
})

// ✅ Get all playlists of a user
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const playlists = await Playlist.find({ owner: userId }).populate("videos")

    return res.status(200).json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
    )
})

// ✅ Get playlist by ID
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId).populate("videos")

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})

// ✅ Add a video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // Only owner can modify
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to modify this playlist")
    }

    if (!playlist.videos.includes(videoId)) {
        playlist.videos.push(videoId)
        await playlist.save()
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist")
    )
})

// ✅ Remove a video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to modify this playlist")
    }

    playlist.videos = playlist.videos.filter(
        v => v.toString() !== videoId.toString()
    )
    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video removed from playlist")
    )
})

// ✅ Delete playlist
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to delete this playlist")
    }

    await playlist.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    )
})

// ✅ Update playlist (name, description)
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to update this playlist")
    }

    if (name) playlist.name = name
    if (description) playlist.description = description
    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
