import { Context } from "./Copi";
import { useContext,useState,memo, useEffect } from "react";
import {AppData} from "../data/Data";
import NoteTagsEditor from "./NoteTagsEditor";


const TitleInput = memo((props)=>{
    const {initialValue,titleOnChangeHandler} = props;
    const [value,setValue] = useState(initialValue);
    const onChangeHandler = (value)=>{
        setValue(value);
        titleOnChangeHandler(value);
    }

    return(
    <input className="input input--noteTitleInput" placeholder="Title" id="title-input" type='text' name='title'
            value={value} onChange={(e)=>{onChangeHandler(e.target.value)}}/>
    )
})

const TextInput = memo((props)=>{
    const {initialValue,textOnChangeHandler} = props;
    const [value,setValue] = useState(initialValue);
    const onChangeHandler = (value)=>{
        setValue(value);
        textOnChangeHandler(value);
    }

    return(
    <textarea className="noteTextInput" placeholder="Note" id="text-input" name="text" 
            value={value} onChange={(e)=>{onChangeHandler(e.target.value)}}>  
    </textarea>
    )
});

const TagBubbles = (props)=>{
    const {noteTags, setShowTagEditor} = props;

    return (
        <div className="tagsBubblesContainer">
            {
            noteTags.length >0?
            AppData.getTagsByIds(noteTags).map((tag)=>
            <div className="tagBubbleContainer" key={tag.key}>
             <div onClick={()=>{setShowTagEditor(true)}} className="tagBubbleContainer__tagBubble" > 
                <img className={`icon`} src="/assets/label.svg" alt="tag" />
                <div className="ellipsis">{tag.name}</div> 
             </div>
             </div>
             )
             :<div className="tagBubbleContainer"> 
                <div onClick={()=>{setShowTagEditor(true)}} className="tagBubbleContainer__tagBubble"> 
                <img className={`icon`} src="/assets/label.svg" alt="tag" />
                <div>Tags</div> 
                </div>  
              </div>    
            }
        </div>
    );   
}

const NoteEditor = (props)=>{
    const {noteToEdit} = props;
    const {setNoteList,appView,setAppView} = useContext(Context);
    const [noteTags,setNoteTags] = useState(noteToEdit? noteToEdit.noteTags:[]);
    const [title,setTitle] = useState(noteToEdit? noteToEdit.title : '');
    const [text,setText] = useState(noteToEdit? noteToEdit.text : '');
    const [noteFirstState,setNoteFirstState]= useState({title:title, text:text, noteTags:[...noteTags]}) ;
    const [showTagEditor,setShowTagEditor] = useState(false);

    function hasSomethingChange(){
        const hasSameTags = ( (noteTags.length === noteFirstState.noteTags.length) &&
                              (noteTags.every((e)=>noteFirstState.noteTags.includes(e))) );

        if( text!==noteFirstState.text || !hasSameTags || title!==noteFirstState.title )
            return true;
        
        return false;
    }

    useEffect(()=>{
        //If we are creating a new note, set the focus on the text input automatically.
        if(!noteToEdit)
         document.getElementById('text-input').focus();
    },[])

    return(
        <div className="centerView">
        <div id="noteEditor"  className="noteEditor">
            <div className="noteEditor__container">
                <div className="viewHeader">
                    {/* Accept button */}
                    <button className="iconButton" onClick={()=>{
                        //If noteToEdit is null, it means that we are creating a new note. Otherwise we are editing an existing one.
                        if(noteToEdit===null){
                            if(hasSomethingChange())
                                AppData.saveNewNote({title: title,text:text,noteTags:noteTags,}).then((r)=>{
                                    if(appView.view === 'tagFiltered')
                                        setNoteList(AppData.getNotesFilteredByTag(appView.tagFilter));
                                    else
                                        setNoteList(AppData.getNotes());
                                });

                            setAppView({...appView,noteEditor:false,sidePanel:false,tagsEditor:false});
                        }
                        else{
                            if(hasSomethingChange())
                                AppData.updateNote({title:title,text:text,key:noteToEdit.key,noteTags:noteTags,}).then((r)=>{
                                    if(appView.view === 'tagFiltered')
                                        setNoteList(AppData.getNotesFilteredByTag(appView.tagFilter));
                                    else
                                        setNoteList(AppData.getNotes());
                                });

                            setAppView({...appView,noteEditor:false,sidePanel:false,tagsEditor:false});
                            }
                        }}>
                        <img className={`icon `} src="/assets/arrow_back.svg" alt="save" /> 
                    </button>
                </div>

                <TitleInput initialValue={title} titleOnChangeHandler={setTitle} />

                <TextInput initialValue={text} textOnChangeHandler={setText}/>

                <TagBubbles noteTags={noteTags} setShowTagEditor={setShowTagEditor} />
            
                {/* Tag editor */}
                {showTagEditor? <NoteTagsEditor noteTags={noteTags} saveNoteTagsHandler={setNoteTags} showTagsEditorHandler = {setShowTagEditor}/> : null}
            </div>
        </div>
    </div>
    );
}

export default NoteEditor;