import { Context } from "./Copi";
import { useContext } from "react";

const AddNoteButton = ()=>{
    const {setNoteToEdit,appView,setAppView} = useContext(Context);

    return (
            <button className="addNoteButton" onClick={()=>{setNoteToEdit(null);setAppView({...appView, noteEditor:true,sidePanel:false,tagsEditor:false})}}>
                <img src={"assets/add.svg"} alt="addNote" />
            </button>
    )
}

export default AddNoteButton;