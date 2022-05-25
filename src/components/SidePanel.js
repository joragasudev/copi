import { Context } from "./Copi";
import { useContext,useState } from "react";
import { AppData } from "../data/Data";
import { ModalBackground,HelpModal } from "./Modal";



const TagList=(props)=>{
    const {clickTagHandler} = props;
    const allTags = AppData.allTagsCache; //[{key:1, name:'groceries'}, {key:2, name:'food'}] 
    return(
        allTags.map((tag)=>{
            return(
                <div key={tag.key} className="sidePanelTagContainer" onClick={()=>{clickTagHandler(tag.key)}}>
                    <img className="icon" src="/assets/label.svg" alt="label" />
                    <div className="ellipsis tagFilterName" >{(tag.name)}</div>
                </div>
            )}
        )
    );
}

const SidePanel = ()=>{
    const {appView,setAppView,setNoteList} = useContext(Context);

    const  clickTagHandler=(tagKey)=>{
        //const notesFilteredByTag = AppData.getNotes().filter((note)=>{ return (note.noteTags.includes(tagKey));});
        const notesFilteredByTag = AppData.getNotesFilteredByTag(tagKey);
        setNoteList(notesFilteredByTag);
        setAppView({...appView,view:'tagFiltered', tagFilter:tagKey,sidePanel:false});
    }

    return(
        <>
            {
                appView.helpModal && <HelpModal closeModalHandler={()=>{setAppView({...appView,helpModal:false});}}/>
            }

            {appView.sidePanel?
            <ModalBackground cancelHandler={()=>{setAppView({...appView,sidePanel:false});}}/>
            :null}

        <div className={`sidePanel ${appView.sidePanel?'sidePanel--show' : ''}`} onClick={()=>{/*setView('default');*/}}>
            <div className="sidePanelHeaders sidePanelHeaders--appTitle" >COPI</div>
            <div className="sidePanelTagContainer" onClick={()=>{setAppView({...appView,view:'default',sidePanel:false}); setNoteList(AppData.getNotes());}}>
                <img className="icon" src="/assets/note.svg" alt="allNotes" />
                <div className="sidePanelHeaders">NOTES</div>
            </div> 
            <hr/>
            <div className="sidePanelHeaders__tagsHeaderContainer">
                <div className="sidePanelHeaders">TAGS</div>
                <div onClick={(e)=>{setAppView({...appView,tagsEditor:true/*, sidePanel:false */});e.stopPropagation();}} className="sidePanelHeaders">EDIT</div>
            </div>
            
            <TagList clickTagHandler={clickTagHandler}/>
            <hr/>

            <div className="sidePanelTagContainer" onClick={()=>{setAppView({...appView,view:'trash',sidePanel:false}); setNoteList(AppData.getTrashedNotes());}}>
                <img className="icon" src="/assets/trashCan.svg" alt="SP" />
                <div className="sidePanelHeaders">DELETED</div>
            </div>    

            <div className="sidePanelTagContainer" onClick={()=>{setAppView({...appView,sidePanel:false, helpModal:true})}}>
                <img className="icon" src="/assets/help.svg" alt="SP" />
                <div className="sidePanelHeaders">HELP</div>
            </div>  
        </div>
        </>
    );
}

export default SidePanel;