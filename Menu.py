#메뉴 만들기

from tkinter import *

root = Tk()
root.title("Menu Example")
root.geometry("640x480+0+0")
root.resizable(True, True)

def close():
    root.quit()
    root.destroy()

#메뉴바

menubar = Menu(root)

menu1 = Menu(menubar, tearoff=0) #tearoff는 메뉴를 분리할 수 있는 옵션
menu1.add_command(label="New File")
menu1.add_command(label="Open")
menu1.add_separator() #메뉴 구분선
menu1.add_command(label="Exit", command=close)
menubar.add_cascade(label="File", menu=menu1) #add_cascade는 메뉴를 추가하는 함수

menu2 = Menu(menubar, tearoff=True, selectcolor="red") #selectcolor는 메뉴 선택 시 색상
menu2.add_radiobutton(label="Undo", state="disable")
menu2.add_radiobutton(label="Redo")
menu2.add_radiobutton(label="Cut")
menubar.add_cascade(label="Edit", menu=menu2)

menu3 = Menu(menubar, tearoff=0)
menu3.add_checkbutton(label="Pyhon Shell")
menu3.add_checkbutton(label="Check Module")
menu3.add_checkbutton(label="Run Module")
menubar.add_cascade(label="Run", menu=menu3)

root.config(menu=menubar)

root.mainloop()
