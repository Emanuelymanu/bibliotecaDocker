declare namespace Express{
    export interface Request {
        usuarios:{
            id:number,
            email: string,
            nome: string
        }
    }
}