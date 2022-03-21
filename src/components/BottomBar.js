import { Context } from "./Copi";
import { useContext } from "react";

const BottomBar = ()=>{
    const {setNoteToEdit,toggleNoteEditor} = useContext(Context);

    return (
        <div className="bottom-bar"> 
            <button onClick={()=>{setNoteToEdit(null);toggleNoteEditor()}}>Panel nueva Nota</button>
        </div>
    )
}

export default BottomBar;