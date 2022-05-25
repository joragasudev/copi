export const ModalBackground = (props,clasNames)=>{
    const {cancelHandler,classNames} = props;
    return (<div className={`modalBackground ${classNames? classNames: '' }`} onClick={()=>{cancelHandler()}}></div>);
}

const Modal = (props)=>{
    const{acceptHandler,cancelHandler,modalText,classNames}= props;
    const closeModalHandler = cancelHandler;
    return(
        <>
            <ModalBackground cancelHandler={cancelHandler}/>
            <div className={`modal ${classNames? classNames: '' }`}>
                <div className="modal__container">
                    <h1 className="modal__text ">{modalText}</h1>
                    <div className="modal__buttonsBar">
                        <button className="iconButton" onClick={()=>{cancelHandler()}}>
                            <img className={`icon `} src="/assets/close.svg" alt="cancel" />
                        </button>
                        <button className="iconButton" onClick={()=>{acceptHandler(); closeModalHandler()}}>
                            <img className={`icon `} src="/assets/done.svg" alt="accept" />
                        </button>
                    </div>
                </div>
            </div>    
        </>
    )
}

export const HelpModal = (props)=>{
    const{closeModalHandler,classNames}= props;
    return(
        <>
        <ModalBackground cancelHandler={closeModalHandler}/>
            <div className={`modal modal--helpModal ${classNames? classNames: ''}`}>
                <div className="modal__container">
                    <div className="helpModal__textContainer">
                        <img className={`icon `} src="/assets/touch.svg" alt="close" />
                        <h1 className="modal__text">Tap/Click a note to copy its content.</h1>
                    </div>
                    <div className="helpModal__textContainer">
                        <img className={`icon `} src="/assets/touch_app.svg" alt="close" />
                        <h1 className="modal__text">Long Tap/Click a note to edit it.</h1>
                    </div>

                    <div className="modal__buttonsBar modal__buttonBar--center">
                        <button className="iconButton" onClick={()=>{closeModalHandler()}}>
                            <img className={`icon `} src="/assets/done.svg" alt="close" />
                        </button>
                    </div>

                </div>
            </div>    
        </>
    )
}

export default Modal;