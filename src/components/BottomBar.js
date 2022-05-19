import { Context } from "./Copi";
import { useContext } from "react";

const BottomBar = ()=>{
    const {setNoteToEdit,appView,setAppView} = useContext(Context);

    return (
        <div className="bottom-barNO"> 
            <button className="btn-circle" onClick={()=>{setNoteToEdit(null);setAppView({...appView, noteEditor:true,sidePanel:false,tagsEditor:false})}}>
                <img className="addIcon" src={"assets/add.svg"} alt="addNote" />
            </button>
        </div>
    )
}

export default BottomBar;