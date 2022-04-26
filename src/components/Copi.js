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
    const [appView,setAppView] = useState({view:'default'});//'default'/'tagsEditor'/'sidePanel'/'noteEditor'
    //const [searchTerm,setSearchTerm] = useState(''); //probablemente no se necesite.
    const [noteList,setNoteList] = useState(null);
    const [noteToEdit,setNoteToEdit] = useState(null);

    //init
    useEffect(()=>{
         AppData.connect().then( ()=>{ setNoteList(AppData.getNotes()) }); 
    },[]);

    const value = {
        appView: appView,
        setAppView : (newAppView)=>setAppView(newAppView),
        // searchTerm: searchTerm,
        // setSearchTerm: (newSearchTerm)=> setSearchTerm(newSearchTerm),
        noteList: noteList,
        setNoteList: setNoteList,
        noteToEdit:noteToEdit,
        setNoteToEdit:(note)=> setNoteToEdit(note),
    }

    return ( noteList
        ? <Context.Provider value = {value}> {children} </Context.Provider> 
        : <div>loading....</div>
    );
}
//appView es un OBJ asi: {view:'tagFiltered'|'default'|'trash' ,tagFilter:12(tagKey), isSelecting:true|false}

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
                {/* <SearchBarAndNoteList/> o bien meter searchBar en NoteList (q seria lo mismo) ????*/}
                {/* <SearchBar/> */}
                <NoteList/>
                <BottomBar/>
            </DefaultProvider>
        </>
    )
}//fin Copi

export default Copi;
