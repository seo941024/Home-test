from tkinter import *
from tkinter import ttk

root = Tk()
root.title("combobox")
root.geometry("300x200+100+100")
root.resizable(True, True)

items = [i+1 for i in range(0,100)]

combobox = ttk.Combobox(root, width=10, height=10, values=items)
combobox.pack()
combobox.set('선택')

root.mainloop()