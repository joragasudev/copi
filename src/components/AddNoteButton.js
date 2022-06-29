import { Context } from "./Copi";
import { useContext } from "react";

const AddNoteButton = (props)=>{
    const {setNoteToEdit} = props;
    const {appView,setAppView} = useContext(Context);

    return (
            <button className={`addNoteButton ${appView.noteEditor? 'addNoteButton--hide':''}`}
             onClick={()=>{setNoteToEdit(null);setAppView({...appView, noteEditor:true,sidePanel:false,tagsEditor:false})}}
             disable={appView.noteEditor?'true':'false'}   
             >
                <img src="assets/add.svg" alt="addNote" />
            </button>
    )
}

export default AddNoteButton;