from tkinter import *

root = Tk()
root.title("Canvas")
root.geometry("640x400+0+0")
root.resizable(True, True)

canvas = Canvas(root, width=200, height=150, bg="white", bd=2)
canvas.pack(fill="both", expand=True) #

canvas.create_line(0, int(200/2), 100, int(200/2), fill="blue")



root.mainloop()