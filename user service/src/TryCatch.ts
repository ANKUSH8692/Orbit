
import type {Request,Response,NextFunction,RequestHandler} from 'express';

const TryCatch =(handler:RequestHandler):RequestHandler=>{
    return async (req:Request,res:Response,next:NextFunction)=>{
        try{
            await handler(req,res,next);
        }catch(err){
            res.status(500).json({message:'Internal Server Error',error:err});
        }
    }
}

export default TryCatch;