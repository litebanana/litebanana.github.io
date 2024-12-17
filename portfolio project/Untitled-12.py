from tkinter import *

# Function to add a task
def add_task():
    task = task_entry.get()
    if task != "":
        tasks_listbox.insert(END, task)
        task_entry.delete(0, END)

# Function to delete a selected task
def delete_task():
    selected_task_index = tasks_listbox.curselection()
    if selected_task_index:
        tasks_listbox.delete(selected_task_index)

# Function to clear all tasks
def clear_tasks():
    tasks_listbox.delete(0, END)

# Create the main window
win = Tk()
win.title("To-Do List")
win.geometry("400x500")
win.configure(bg="#F0F0F0")

# App title
title_label = Label(win, text="To-Do List", font=("Arial", 24, "bold"), fg="#333", bg="#F0F0F0")
title_label.pack(pady=20)

# Task entry frame
entry_frame = Frame(win, bg="#F0F0F0")
entry_frame.pack(pady=10)

task_entry = Entry(entry_frame, font=("Arial", 16), width=25, relief=GROOVE, bd=2)
task_entry.grid(row=0, column=0, padx=10)

add_btn = Button(entry_frame, text="Add Task", font=("Arial", 12, "bold"), bg="#4CAF50", fg="white", command=add_task, relief=FLAT)
add_btn.grid(row=0, column=1)

# Tasks listbox
tasks_frame = Frame(win, bg="#F0F0F0")
tasks_frame.pack(pady=20)

tasks_listbox = Listbox(tasks_frame, font=("Arial", 14), width=30, height=12, bd=2, relief=GROOVE, selectbackground="#ADD8E6", highlightthickness=0)
tasks_listbox.pack(side=LEFT, padx=10)

# Scrollbar for the listbox
scrollbar = Scrollbar(tasks_frame)
scrollbar.pack(side=RIGHT, fill=Y)
tasks_listbox.config(yscrollcommand=scrollbar.set)
scrollbar.config(command=tasks_listbox.yview)

# Buttons for delete and clear
button_frame = Frame(win, bg="#F0F0F0")
button_frame.pack(pady=20)

delete_btn = Button(button_frame, text="Delete Task", font=("Arial", 12, "bold"), bg="#F44336", fg="white", command=delete_task, width=12, relief=FLAT)
delete_btn.grid(row=0, column=0, padx=10)

clear_btn = Button(button_frame, text="Clear Tasks", font=("Arial", 12, "bold"), bg="#FF9800", fg="white", command=clear_tasks, width=12, relief=FLAT)
clear_btn.grid(row=0, column=1, padx=10)

# Run the application
win.mainloop()
