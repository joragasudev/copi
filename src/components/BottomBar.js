import { Context } from "./Copi";
import { useContext } from "react";

const BottomBar = ()=>{
    const {setNoteToEdit,setAppView} = useContext(Context);

    return (
        <div className="bottom-bar"> 
            <button onClick={()=>{setNoteToEdit(null);setAppView({view:'noteEditor'})}}>Panel nueva Nota</button>
        </div>
    )
}

export default BottomBar;