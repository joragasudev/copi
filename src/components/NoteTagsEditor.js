import { useState ,memo } from "react";
import {AppData} from "../data/Data";

const NoteTagsEditor = memo((props)=>{
    const {noteTags,saveNoteTagsHandler,showTagsEditorHandler} = props;
    const [thisNoteTags,setThisNoteTags] = useState(noteTags);//example: [1,2,55,74]
    const [filteredTagsAvailable,setFilteredTagsAvailable] = useState(AppData.allTagsCache);//example: [{id:74, tagName:'X'}]
    const [term,setTerm] = useState('')
    
    const filterChangeHandler = (term)=>{
        setTerm(term);
        if(term.trim() ==='')
            return (setFilteredTagsAvailable(AppData.allTagsCache));

        const newFilteredTags = AppData.allTagsCache.filter((tag)=>{
            const termNormalized = term.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
            const tagNormalized = tag.name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
            return (tagNormalized.includes(termNormalized));
        });
        return setFilteredTagsAvailable(newFilteredTags);
    }

    const checkBoxesHandleChange = (e)=>{
        let tagKey = parseInt(e.target.value);
        setThisNoteTags(//Toggle
            thisNoteTags.includes(tagKey)
             ? thisNoteTags.filter(id => id !== tagKey) 
             : [ ...thisNoteTags, tagKey ]
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
            {/* Title and back button (<-) */}
            <div className="viewHeader">
                <button className="iconButton" onClick={()=>{saveButtonHandler(); showTagsEditorHandler(false);}}  >
                    <img className={`icon `} src="assets/arrow_back.svg" alt="back" />
                </button>
                <div className="viewHeader__title" >Edit note tags</div>
            </div>
            <hr/>
            
            {/* Tag Filter */}
            <TagFilter filterChangeHandler = {filterChangeHandler} showCreateTagButton={(!didTagAlreadyExist(term) && (term!==''))}/>
            <hr/>

            {/* Tag with its checkbox */}
            {filteredTagsAvailable.map((tag)=>{
                return <CheckBoxTag key={tag.key} tagName={tag.name} tagKey={tag.key} isChecked={thisNoteTags.includes(tag.key)} handleChange={checkBoxesHandleChange}/>
            })}
        </div>
    )
})

const CheckBoxTag = (props)=>{
    const {tagName,tagKey,isChecked,handleChange} = props;
    return (
    <div className="noteTagContainer">

        <img className="icon" src="assets/label.svg" alt="label" />

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
                <input className="input flexGrow_high" autoComplete="off" id="searchTags" type='text' name='searchTags' onChange={(e)=>{
                    filterChangeHandler(e.target.value);
                    setTerm(e.target.value);
                }}/>
                <button className="iconButton" onClick={()=>{document.getElementById("searchTags").focus();}}>
                    <img className="icon " src="assets/search.svg" alt="magGlass" />
                </button>
                <button className="iconButton" onClick={()=>{addTagHandler(term)}} disabled={!showCreateTagButton}> 
                    <img className= {`icon ${!showCreateTagButton?'icon--disabled':''}`} src="assets/add.svg" alt="addtag" />
                </button>
            </div>
        </>
    )
}

export default NoteTagsEditor;