from tkinter import *
from functools import partial
win = Tk()
btn_txt = ("**", "//", "%", "C", "7", "8", "9", "+", "4", "5", "6", "-", "1", "2", "3", "*", ".", "0", "=", "/")
row_num = col_num = 0
res = Label(win, text="0", height=2, fg="black", font=("Arial", 16), bg="beige",)
res.grid(row=0, column=0, columnspan=4, pady= 18)
def command(cmd):
    if res.cget("text") == "0":
        res.config(text=cmd)
    elif cmd == "C":
        res.config(text="0")
    elif cmd == "=":
       try: res.config(text=str(eval(res.cget("text"))))
       except: res.config(text="Syntax Error")
    elif res.cget("text") == "Syntax Error":
        res.config(text="")
        res.config(text=res.cget("text") + cmd)
    else:
        res.config(text=res.cget("text") + cmd)
for i in range(len(btn_txt)):
    Button(win, width=4, text=btn_txt[i], font=("Maiandra GD", 16), bg="beige", command=partial(command, btn_txt[i])).grid(row=row_num+1, column=col_num)
    col_num += 1
    if col_num == 4:
        col_num = 0
        row_num += 1
win.geometry("240x330+830+340")
win.title("Calculator")
win.mainloop()
