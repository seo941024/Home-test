from tkinter import *
from tkinter import messagebox

#Radio button > 숫자 변수 Intvar 사용

root = Tk()
root.title("Radio Button Example")
root.geometry("640x480")
root.resizable(True, True)

def show(): #def는 함수 show는 함수 이름 a로 바꾸어도 된다.
    print("item1: %d\nitem2: %d\n" % (variety1.get(), variety2.get())) #get()은 라디오 버튼의 값을 가져오는 함수
    messagebox.showinfo("Button Clicked", "item1: {0}, \nitem2: {1}\n".format(variety1.get(), variety2.get())) #messagebox는 팝업창을 띄우는 함수

variety1 = IntVar()
variety2 = IntVar()

bt1 = Radiobutton(root, text="item1", value=1, variable=variety1) #Radiobutton은 라디오 버튼을 만드는 함수 variable은 라디오 버튼의 값을 저장하는 변수 value는 라디오 버튼의 값
bt2 = Radiobutton(root, text="item2", value=2, variable=variety1) 
bt3 = Radiobutton(root, text="item3", value=3, variable=variety2) 
bt4 = Radiobutton(root, text="item4", value=4, variable=variety2)

bt1.pack()
bt2.pack()
bt3.pack()
bt4.pack()

button = Button(root, width=10, text="Show", overrelief="solid", command=show)
button.pack()

root.mainloop()