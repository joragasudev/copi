import { Context } from "./Copi";
import { useContext,useRef, useState,memo, useEffect } from "react";
import {AppData} from "../data/Data";
import NoteTagsEditor from "./NoteTagsEditor";

//if id===null -> es una nueva nota, sino es una edicion de nota.

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
})

const NoteEditor = ()=>{
    const {noteToEdit,setNoteList,appView,setAppView} = useContext(Context);
    const [noteTags,setNoteTags] = useState(noteToEdit?noteToEdit.noteTags:[]);
    const [title,setTitle] = useState(noteToEdit? noteToEdit.title : '');
    const [text,setText] = useState(noteToEdit? noteToEdit.text : '');
    const [noteFirstState,setNoteFirstState]= useState({title:title, text:text, noteTags:[...noteTags]}) ;
    
    const [showTagEditor,setShowTagEditor] = useState(false);//Ver si esto no me combiene hacerlo simil al tagsEditor....???? quiza no

    
    function hasSomethingChange(){
        const hasSameTags = ( (noteTags.length === noteFirstState.noteTags.length) &&
                              (noteTags.every((e)=>noteFirstState.noteTags.includes(e))) );

        if( text!==noteFirstState.text || !hasSameTags || title!==noteFirstState.title )
            return true;
        
        return false;
    }
    useEffect(()=>{
        if(!noteToEdit)
         document.getElementById('text-input').focus();
    },[])

    return(
        <div className="centerView">

        <div id="noteEditor"  className={`noteEditor`}>
            <div className="noteEditor__container">
            <div className="viewHeader">
            {/* Accept button */}
                <button className="iconButton" onClick={()=>{
                    if(noteToEdit===null){//(new note)
                        if(hasSomethingChange())
                            AppData.saveNewNote({title: title,text:text,noteTags:noteTags,}).then((r)=>{
                                if(appView.view === 'tagFiltered')
                                    setNoteList(AppData.getNotesFilteredByTag(appView.tagFilter));
                                else
                                    setNoteList(AppData.getNotes());
                            });

                        setAppView({...appView,noteEditor:false,sidePanel:false,tagsEditor:false});
                    }
                    else{//edited note.
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
                        {/* <img className={`icon `} src="/assets/done.svg" alt="save" />  */}
                        <img className={`icon `} src="/assets/arrow_back.svg" alt="save" /> 
                </button>
            </div>

            {/* Titulo */}
            <TitleInput initialValue={title} titleOnChangeHandler={setTitle} />

            {/* Texto */}
            <TextInput initialValue={text} textOnChangeHandler={setText}/>

            {/* Burbujas tags  */}
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
           
            {/* <button onClick={()=>{setShowTagEditor(true)}}> Tags </button> */}
            {/* Tag editor */}
            {showTagEditor? <NoteTagsEditor /*note={noteToEdit}*/ noteTags={noteTags} saveNoteTagsHandler={setNoteTags} showTagsEditorHandler = {setShowTagEditor}/> : null}
        </div>
        </div>
    </div>
    );
}

const NoteEditorContainer = () =>{
    const {appView} = useContext(Context);
    //const {noteToEdit2}= props;
    // return(<>{(appView.view==='noteEditor')?<NoteEditor />:null}</>);
    return(<>{appView.noteEditor?<NoteEditor />:null}</>);
}

export default NoteEditorContainer;