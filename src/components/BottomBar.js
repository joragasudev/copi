import { Context } from "./Copi";
import { useContext } from "react";

const BottomBar = ()=>{
    const {toggleNoteEditor} = useContext(Context);

    return (
        <div className="bottom-bar"> 
            <button onClick={()=>{toggleNoteEditor()}}>Panel nueva Nota</button>
        </div>
    )
}

export default BottomBar;