import { Context } from "./Copi";
import { useContext,useState } from "react";
import { AppData } from "../data/Data2";


const TagList=(props)=>{
    const {clickTagHandler} = props;
    const allTags = AppData.allTagsCache; //[{key:1, name:'groceries'}, {key:2, name:'food'}] 
    return(
        allTags.map((tag)=>{
            return(
                <div key={tag.key} className="tag-filter-container">
                    <p onClick={()=>{clickTagHandler(tag.key)}}>{tag.name}</p>
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
        setAppView({view:'tagFiltered', tagFilter:tagKey});
    }

    return(
        <div className={`side-panel ${(appView.view==='sidePanel')?'side-panel-show' : ''}`} onClick={()=>{/*setView('default');*/}}>
            Side panel
            <button onClick={(e)=>{setAppView({view:'tagsEditor'});e.stopPropagation();}}>Editar</button>
            {/* <button onClick={()=>{setNoteList(AppData.allNotesCache);}}>Todas</button> */}
            <button onClick={()=>{setAppView({view:'default'}); setNoteList(AppData.getNotes());}}>Todas</button>
            <button onClick={()=>{setAppView({view:'trash'}); setNoteList(AppData.getTrashedNotes());}}>TrashCan</button>
            <TagList clickTagHandler={clickTagHandler}/>
        </div>
    );
}

export default SidePanel;