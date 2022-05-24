import { useEffect, useMemo, useState ,memo } from "react";
import {AppData} from "../data/Data2";



const NoteTagsEditor = memo((props)=>{
    console.log('TagsEditor rendering...');
    const {/*note*/noteTags,saveNoteTagsHandler,showTagsEditorHandler} = props;
    const [thisNoteTags,setThisNoteTags] = useState(noteTags);//[1,2,55,74]
    const [filteredTagsAvailable,setFilteredTagsAvailable] = useState(AppData.allTagsCache);//[{id:74, tagName:'X'}]
    const [term,setTerm] = useState('')
    
    //Esto evita que quede la info de otra nota abierta anteriormente. NO hace falta si TagsEditor se destruye cada vez q se cierra.
    // const noteTags = useMemo(()=> note? note.noteTags : [] ,[note]);
    // useEffect(()=>{
    //     setThisNoteTags(noteTags);
    // },[noteTags]);

    const filterChangeHandler = (term)=>{
        setTerm(term);
        if(term.trim() ==='')
            return (setFilteredTagsAvailable(AppData.allTagsCache));

        const newFilteredTags = AppData.allTagsCache.filter((tag)=>{
            const termNormalized = term.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
            const tagNormalized = tag.name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
            return (tagNormalized.startsWith(termNormalized));
        });
        return setFilteredTagsAvailable(newFilteredTags);
    }

    const checkBoxesHandleChange = (e)=>{
        let tagKey = parseInt(e.target.value);
        setThisNoteTags(//esto es un toggle
            thisNoteTags.includes(tagKey) //Aca tiene que ser el id, y no su tagName HHH (e.target.value)
             ? thisNoteTags.filter(id => id !== tagKey) //(i=>i.id !== e.target.value)
             : [ ...thisNoteTags, tagKey ] //e.target.value
        );
    }
   
    const saveButtonHandler=()=>{
        saveNoteTagsHandler([...thisNoteTags]);
    }

    const didTagAlreadyExist = (term)=>{
        const tagsWithSameNameAsTerm = AppData.allTagsCache.filter((tag)=>{
            const termNormalized = term.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
            const tagNormalized = tag.name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
            return (tagNormalized === termNormalized);
        });
        return (tagsWithSameNameAsTerm.length > 0);
    }
    
    return(
        <div className="tagsEditor"> 
            {/* Titulo y boton <- */}
            <div className="viewHeader">
                <button className="iconButton" onClick={()=>{saveButtonHandler(); showTagsEditorHandler(false);}}  >
                    <img className={`icon `} src="/assets/arrow_back.svg" alt="back" />
                </button>
                <div className="sidePanelHeaders centerHeader" >Edit note tags</div>
            </div>

            <hr/>
            
            {/* Filtro de tags */}
            <TagFilter filterChangeHandler = {filterChangeHandler} showCreateTagButton={(!didTagAlreadyExist(term) && (term!==''))}/>

            <hr/>

            {/* Tags con sus checkboxes */}
            {filteredTagsAvailable.map((tag)=>{ //HHH
                return <CheckBoxTag key={tag.key} tagName={tag.name} tagKey={tag.key} isChecked={thisNoteTags.includes(tag.key)} handleChange={checkBoxesHandleChange}/>
            })}
        </div>
    )
})

const CheckBoxTag = (props)=>{
    const {tagName,tagKey,isChecked,handleChange} = props;
    return (
    <div className="noteTagContainer">

        <img className="icon" src="/assets/label.svg" alt="label" />

        <div className="ellipsis flexGrow_high tagFilterName">{tagName}</div>

        <input type ='checkbox' 
        name={tagName}
        onChange = {handleChange}
        checked={isChecked}
        value={tagKey}
        />
    </div> 
    )
}

const TagFilter = (props)=>{
    const {filterChangeHandler,showCreateTagButton} = props;
    const [term,setTerm] = useState('');

    const addTagHandler=(term)=>{
        AppData.saveNewTag(term).then(()=>{
            filterChangeHandler(term);
        }
        );
    }
    return(
        <>
            
            <div className="tagAddContainer">
                <input className="input flexGrow_high" id="searchTags" type='text' name='searchTags' onChange={(e)=>{
                    filterChangeHandler(e.target.value);
                    setTerm(e.target.value);
                }}/>
                <button className="iconButton" onClick={()=>{document.getElementById("searchTags").focus();}}>
                    <img className="icon " src={"assets/search.svg"} alt="magGlass" />
                </button>
                <button className="iconButton" onClick={()=>{addTagHandler(term)}} disabled={!showCreateTagButton}> 
                    <img className= {`icon ${!showCreateTagButton?'icon-disabled':''}`} src="/assets/add.svg" alt="addtag" />
                </button>
            </div>
            
            {/* {showCreateTagButton? <button onClick={()=>{addTagHandler(term)}}>{`Crear tag:${term}`}</button>:null} */}
        </>
    )
}

export default NoteTagsEditor;