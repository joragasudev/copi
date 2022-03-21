import { Context } from "./Copi";
import { useContext,useState } from "react";
import { NoteData } from "../data/Data";
import Modal from "./Modal"

const TagListViejo=(props)=>{
    console.log('Rendering TagList...');
    const {clickTagHandler} = props;
    const allTagsAvailable = NoteData.allTagsAvailable; //[{id:4, name:'Compras'}, ... ]
    const [modal,setModal] = useState({show:false});
    //acceptHandler,cancelHandler,modalText,classNames
    const deleteTag = (tagId)=>{
        console.log(`borraria el tag ${tagId}`);
    }
    console.log(modal.show);
    return(
        modal.show
        ?<Modal acceptHandler={()=>{deleteTag(modal.tagId)}}
                cancelHandler={()=>{setModal({show:false})}}
                modalText={modal.text}
                classNames=""  />
        :allTagsAvailable.map((tag)=>{
            return(
                <div key={tag.id} className="tag-filter-container">
                    <button onClick={()=>{ setModal({show:true,tagId:tag.id,text:`Borrar tag: ${tag.name} ?`})}} className="tag-filter-button">D</button>
                    <input className="tag-filter-input" type="text" value={tag.name}></input>
                    <button onClick={()=>{clickTagHandler(tag.id)}} className="tag-filter-button">V</button>
                </div>
            )}
        )
    );
}
const TagList=(props)=>{
    console.log('Rendering TagList...');
    const {clickTagHandler} = props;
    const allTagsAvailable = NoteData.allTagsAvailable; //[{id:4, name:'Compras'}, ... ]
    return(
        allTagsAvailable.map((tag)=>{
            return(
                <div key={tag.id} className="tag-filter-container">
                    <p onClick={()=>{clickTagHandler(tag.id)}}>{tag.name}</p>
                </div>
            )}
        )
    );
}

const SidePanel = ()=>{
    const {isSidePanelVisible, toggleSidePanel,noteList,setNoteList,toggleTagsEditor} = useContext(Context);

    const  clickTagHandler=(tagId)=>{
        //deberia borrar el search filter y filtrar allNotes
        //allTags seria [{id:4, name:'Compras'}, ... ]
        //y las notas [{id:55, tags:[1,4,6],... }, ...]
        const noteList = NoteData.allNotes;
        console.log(noteList);
        const notesFilteredByTag = noteList.filter((note)=>{
            return (note.noteTags.includes(tagId.toString()));//Ojo porahi tienen q ser ambas strings/numb
        });
        console.log(notesFilteredByTag);
        setNoteList(notesFilteredByTag);
    }

    return(
        <div className={`side-panel ${isSidePanelVisible?'side-panel-show' : ''}`}
            onClick={()=>{toggleSidePanel()}}
        >
            Side panel
        <button onClick={(e)=>{toggleTagsEditor();e.stopPropagation();}}>Editar</button>
        <button onClick={()=>{setNoteList(NoteData.allNotes)}}>Todas</button>
        <TagList clickTagHandler={clickTagHandler}/>
        
        </div>
    );
}

export default SidePanel;