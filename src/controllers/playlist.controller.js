import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlists.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"

//create playlist
// add vdo to playlist 
// remove video
//edit name,descrption
//get userplaylist
//playlist by id
//delete playlist

const createPlaylist= asyncHandler(async(req,res)=>{
    //name,desc,owner:req.user,videos
    try {
        const{name,description}= req.body;
        if(!name || name.trim()===""){
            throw new ApiError(400,"Provide name for the playlist");
        }

        const playlist= await Playlist.create({
            name,
            description: description==="" ? "": description,
            owner: req.user?._id
        })

        if(!playlist){
            throw new ApiError(500,"Playlist Creation Failed!!")
        }

        return res.status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist Successfully Created!!"
            )
        )

    } catch (error) {
        console.log("Error occured while creating playlist", error.message);
    }
})

const addVdoToPlaylist= asyncHandler(async(req,res)=>{
    try {
        const {playlistId,videoId}= req.params;

        const check= await Playlist.findOne({
            _id:playlistId,
            video:videoId
        })

        if(check){
            return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Video is already added to playlist!!"
                )
            )
        }

        const updatedPlaylist= await Playlist.findByIdAndUpdate(
            { _id: new mongoose.Types.ObjectId(playlistId)},
            { $push:{ videos:videoId}},
            {new:true}
        )

        if(!updatedPlaylist){
            throw new ApiError(500,"Error while adding video to playlist")
        }

        return res.status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video Added Successfully!!"
            )
        )
    } catch (error) {
        throw new ApiError(500,error.message);
    }
})

const removeVdoFromPlaylist= asyncHandler(async(req,res)=>{
    const {playlistId,videoId}= req.params;
    
    const isPresent= await Playlist.findOne(
       { 
            playlistId,
            videos:videoId 
        }
    )
    console.log(isPresent);
    if(!isPresent){
        return res.status(200)
        .json(new ApiResponse(200,{},"Video is not present in playlist!!"))
    }
    const deleted=await Playlist.findByIdAndUpdate(
        playlistId,
        {$pull:{videos:videoId}}
    )
    if(!deleted){
        throw new ApiError(500,"Error occured while deleting!")
    }
    return res.status(200)
    .json(
        new ApiResponse(200,{},"Video Removed From Playlist!!")
    )  
})

const updatedPlaylistDetails = asyncHandler(async(req,res)=>{
    const {playlistId}= req.params
    const {name,description}=req.body

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Playlist doesnot exist!!")
    }

    if(!name && !description){
        throw new ApiError(400,"No details to update");
    }

    if(name && name.trim()===""){
        throw new ApiError(400,"Name is empty");
    }
    if(description && description.trim()===""){
        throw new ApiError(400,"Description is empty");
    }
    
    const prevDetails= await Playlist.findById({_id:playlistId});
    
    if(prevDetails.name==name){
        throw new ApiError(400,"Name field is not updated");
    }

    if(prevDetails.description==description){
        throw new ApiError(400,"Description field is not updated");
    }

    const upatedDetails=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name,
            description
        },
        {new:true}
    )

    if(!upatedDetails){
        throw new ApiError(500,"Error occured while updating details")
    }

    return res.status(200)
    .json(new ApiResponse(200,upatedDetails,"Playlist details updated Successfully!!"))
})

const getPlaylistById= asyncHandler(async(req,res)=>{
    const {playlistId}= req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Playlist doesnot exist")
    }
    //video=> thumbnail, title description,ownername
    const playlist=await Playlist.aggregate([
        {
            $match:{
                _id:playlistId
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"video"
            }
        }
    ])

    console.log(playlist);
})

export{
    createPlaylist,
    addVdoToPlaylist,
    removeVdoFromPlaylist,
    updatedPlaylistDetails,
    getPlaylistById
}