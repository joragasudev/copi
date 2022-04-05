import { Context } from "./Copi";
import { useContext,useState } from "react";
import { AppData } from "../data/Data2";


const TagList=(props)=>{
    console.log('Rendering TagList...');
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
    const {view,setView,setNoteList} = useContext(Context);

    const  clickTagHandler=(tagKey)=>{
        //deberia borrar el search filter y filtrar allNotes
        //allTags seria [{id:4, name:'Compras'}, ... ]
        //y las notas [{id:55, tags:[1,4,6],... }, ...]
        const notesFilteredByTag = AppData.allNotesCache.filter((note)=>{ //<-cambiar x AppData.getNotes()
            return (note.noteTags.includes(tagKey));//Ojo porahi tienen q ser ambas strings/numb
        });
        setNoteList(notesFilteredByTag);
    }

    return(
        <div className={`side-panel ${(view==='sidePanel')?'side-panel-show' : ''}`}onClick={()=>{setView('default')}}>
            Side panel
            <button onClick={(e)=>{setView('tagsEditor');e.stopPropagation();}}>Editar</button>
            <button onClick={()=>{setNoteList(AppData.allNotesCache);}}>Todas</button>{/*<-cambiar x AppData.getNotes()*/}
            <button onClick={()=>{setNoteList(AppData.getDeletedNotes());}}>TrashCan</button>
            <TagList clickTagHandler={clickTagHandler}/>
        </div>
    );
}

export default SidePanel;