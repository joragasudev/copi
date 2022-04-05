//PPAL
import {AppData} from "../data/Data2";
import { createContext,useContext,useEffect,useState } from "react";
import './styles.css';
import SidePanel from './SidePanel';
import SearchBar from './SearchBar';
import BottomBar from './BottomBar';
import NoteList from './NoteList';
import NoteEditorContainer from "./NoteEditor";
import TagsEditorContainer from "./TagsEditor";


export const Context = createContext({
    //esto era el provider q agarra cuando se usa de un Componente que no es hijo de Default Provider? no?
    //isSidePanelVisible:false,
    //toggleSidePanel:()=>console.log('toggleSidePanel en createContext')
}); 

const DefaultProvider = ({children})=>{
    const [view,setView] = useState('default');//'default'/'tagsEditor'/'sidePanel'/'noteEditor'
    const [searchTerm,setSearchTerm] = useState(''); //probablemente no se necesite.
    const [noteList,setNoteList] = useState(null);
    const [noteToEdit,setNoteToEdit] = useState(null);

    //init
    useEffect(()=>{
         AppData.connect().then( ()=>{ setNoteList(AppData.allNotesCache) }); //<-cambiar x AppData.getNotes()
    },[]);

    const value = {
        // isSidePanelVisible: isSidePanelVisible,
        // toggleSidePanel: ()=>setSidePanelVisible(!isSidePanelVisible),
        // isNoteEditorVisible: isNoteEditorVisible,
        // toggleNoteEditor: ()=>setNoteEditorVisible(!isNoteEditorVisible)  
        // isTagsEditorVisible: view==='tagsEditor',
        // toggleTagsEditor: ()=>setView(view=>view==='tagsEditor'? 'default' : 'tagsEditor'),
        // isSidePanelVisible: view==='sidePanel',
        // toggleSidePanel: ()=>setView(view=>view==='sidePanel'? 'default' : 'sidePanel'),
        // isNoteEditorVisible: view==='noteEditor',
        // toggleNoteEditor: ()=>setView(view=>view==='noteEditor'? 'default' : 'noteEditor'),
        view: view,
        setView : (newView)=>setView(newView),
        searchTerm: searchTerm,
        setSearchTerm: (newSearchTerm)=> setSearchTerm(newSearchTerm),
        noteList: noteList,
        setNoteList: setNoteList,
        noteToEdit:noteToEdit,
        setNoteToEdit:(note)=> setNoteToEdit(note),
    }
    //console.log('R. Provider...');
    //console.log(value);
    return ( noteList
        ? <Context.Provider value = {value}> {children} </Context.Provider> 
        : <div>loading....</div>
    );
}


/*
//Tests. Lo de arriba es la posta.
import {AppData} from "../data/Data2";
import { useEffect } from "react";
const Tests = ()=>{
    //init
    useEffect(()=>{
        AppData.connect().then( 
            ()=>{
                console.log('Coeccion exitosa. Data2 notesCache/TagsCache/notesOrderCache');
                console.log(AppData.allNotesCache);
                console.log(AppData.allTagsCache);
                console.log(AppData.notesOrderCache);
            }) 
        },[]); 

    const guardarNuevaNota = (nuevaNota)=>{
        AppData.saveNewNote(nuevaNota)
        .then(response=>console.log(response));
    }
    const actualizarNota3 = ()=>{
        AppData.updateNote({key:3,title:'T actualizado',text:'Texto Actualizado',noteTags:['tagFalso']})
        .then(response=>console.log(response));
    }
    const reordenarNota3x5 = ()=>{
        AppData.reorderNotes(3,5);
    }
    const guardarEstosTags = ()=>{
        const newTagsArray = ['tag1','tag2','tag3','tag4'];
        AppData.saveNewTags(newTagsArray);
    }

    const updatearTagKey = (key,newTagName)=>{
        AppData.updateTags([{key:key,name:newTagName}]);
    }

    return(
        <>
            <p>Abrir consola </p>
            <button onClick={()=> guardarNuevaNota({
                    title:`TiT ${Math.random().toFixed(3)}`,
                    text:`TeX ${Math.random().toFixed(3)}`,
                    noteTags: [],
                    state:'listed',
                })
            }>+Random note</button>
            <button onClick={()=>actualizarNota3()}>Actualizar el 3</button>
            <button onClick={()=>reordenarNota3x5()}>Cambio 3 por 5</button>
            <button onClick={()=>guardarEstosTags()}>Guardar TagS</button>
            <button onClick={()=>updatearTagKey(1,'cambiado')}>Updateo tag 1</button>
        </>
    )
}//Fin Tests
*/




const Copi = () => {
    return(
        <>
            {/* <Tests/> */}
            <DefaultProvider>
                <SidePanel/>
                <NoteEditorContainer/>
                <TagsEditorContainer/>
                <SearchBar/>
                <NoteList/>
                <BottomBar/>
            </DefaultProvider>
        </>
    )
}//fin Copi

export default Copi;
