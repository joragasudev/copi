import { Context } from "./Copi";
import { useContext } from "react";

const BottomBar = ()=>{
    const {setNoteToEdit,setView} = useContext(Context);

    return (
        <div className="bottom-bar"> 
            <button onClick={()=>{setNoteToEdit(null);setView('noteEditor')}}>Panel nueva Nota</button>
        </div>
    )
}

export default BottomBar;