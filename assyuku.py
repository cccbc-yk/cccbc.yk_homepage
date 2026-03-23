import os
import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image
import pillow_avif  # ← これ重要（AVIF対応）

def select_folder():
    folder = filedialog.askdirectory()
    if folder:
        input_path.set(folder)

def convert_images():
    src = input_path.get()
    if not src:
        messagebox.showerror("エラー", "フォルダを選択してください")
        return

    dst = os.path.join(src, "converted_avif")
    os.makedirs(dst, exist_ok=True)

    files = [f for f in os.listdir(src) if f.endswith(".webp")]

    if not files:
        messagebox.showinfo("情報", "WebP画像が見つかりません")
        return

    status.set("変換中...")

    for i, file in enumerate(files):
        try:
            input_file = os.path.join(src, file)
            output_file = os.path.join(dst, file.replace(".webp", ".avif"))

            img = Image.open(input_file).convert("RGB")
            img.save(output_file, format="AVIF", quality=50)

            status.set(f"変換中 {i+1}/{len(files)}")

            root.update()

        except Exception as e:
            print("エラー:", file, e)

    status.set("完了！")
    messagebox.showinfo("完了", f"{len(files)}枚変換しました\n保存先: {dst}")

# GUI
root = tk.Tk()
root.title("WebP → AVIF 一括変換")
root.geometry("400x200")

input_path = tk.StringVar()
status = tk.StringVar()

tk.Label(root, text="フォルダを選択").pack(pady=10)

tk.Entry(root, textvariable=input_path, width=40).pack()

tk.Button(root, text="フォルダ選択", command=select_folder).pack(pady=5)

tk.Button(root, text="変換開始", command=convert_images).pack(pady=10)

tk.Label(root, textvariable=status).pack()

root.mainloop()