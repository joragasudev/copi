import { Context } from "./Copi";
import { useContext,useState } from "react";
import { AppData } from "../data/Data2";
import { ModalBackground,HelpModal } from "./Modal";


const TagList=(props)=>{
    const {clickTagHandler} = props;
    const allTags = AppData.allTagsCache; //[{key:1, name:'groceries'}, {key:2, name:'food'}] 
    return(
        allTags.map((tag)=>{
            return(
                <div key={tag.key} className="side-panel-item-container" onClick={()=>{clickTagHandler(tag.key)}}>
                    <img className="svgIcon" src="/assets/label.svg" alt="label" />
                    <div className="side-panel-item-text tag-filter-name" >{(tag.name)}</div>
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

        <div className={`side-panel ${appView.sidePanel?'side-panel-show' : ''}`} onClick={()=>{/*setView('default');*/}}>
            <div className="side-panel-item-text" style={ {display:"flex", justifyContent:"center", fontSize:"1.4rem" }} >COPI</div>
            <div className="side-panel-item-container" onClick={()=>{setAppView({...appView,view:'default',sidePanel:false}); setNoteList(AppData.getNotes());}}>
                <img className="svgIcon" src="/assets/note.svg" alt="allNotes" />
                <div className="side-panel-item-text">NOTES</div>
            </div> 
            <hr/>
            <div style={ {display:"flex", justifyContent:"space-between", margin:"0px 8px 0px 8px"} }>
                <div className="side-panel-item-text">TAGS</div>
                <div onClick={(e)=>{setAppView({...appView,tagsEditor:true/*, sidePanel:false */});e.stopPropagation();}} className="side-panel-item-text">EDIT</div>
            </div>
            
            <TagList clickTagHandler={clickTagHandler}/>
            <hr/>

            <div className="side-panel-item-container" onClick={()=>{setAppView({...appView,view:'trash',sidePanel:false}); setNoteList(AppData.getTrashedNotes());}}>
                <img className="svgIcon" src="/assets/trashCan.svg" alt="SP" />
                <div className="side-panel-item-text">DELETED</div>
            </div>    

            <div className="side-panel-item-container" onClick={()=>{setAppView({...appView,sidePanel:false, helpModal:true})}}>
                <img className="svgIcon" src="/assets/help.svg" alt="SP" />
                <div className="side-panel-item-text">HELP</div>
            </div>  
        </div>
        </>
    );
}

export default SidePanel;