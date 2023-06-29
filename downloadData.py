import pathlib
import webbrowser
import os
import time
import shutil
import pyautogui

import pynput
from pynput.mouse import Button

home = pathlib.Path().home()
downloads = f'{home}/Downloads'
controller = pynput.mouse.Controller()

pairName = ""


def open_download_links():
    print(f"Opening Downloads for {pairName}")
    for i in range(2000, 2023):
        if i != 2018 and i != 2019 and i != 2020 and i != 2013 and i != 2021 and i != 2012 and i != 2006:
            continue
        base_URL = f'https://www.histdata.com/download-free-forex-historical-data/?/metatrader/1-minute-bar-quotes/{pairName.lower()}/{i}'
        webbrowser.open_new(base_URL)
        
        time.sleep(1)
        controller.press(Button.left)
        time.sleep(0.1)
        controller.release(Button.left)
        time.sleep(0.5)
        pyautogui.hotkey("command", 'w')


# HISTDATA_COM_MT_EURUSD_M12022.zip
def unzip_all():
    files = os.listdir(downloads)

    # unzip all files
    for f in files:
        if f'HISTDATA_COM_MT_{pairName}_M1' in f and '.zip' in f:
            full_path = f'{downloads}/{f}'
            os.system(f'open {full_path}')
            time.sleep(1)
            if os.path.exists(full_path):
                os.remove(full_path) # one file at a time
    
    move()

def move():
    # create div if it doesnt exist
    directoryName = f'./historicalData/{pairName}'
    if not os.path.exists(f'./historicalData/{pairName}'):
        os.makedirs(directoryName)

    # find all and move to project 
    files = os.listdir(downloads)
    for f in files:
        if f'HISTDATA_COM_MT_{pairName}_M1' in f and '.zip' not in f:
            try:
                year = f[-4:]
                base = f'DAT_MT_{pairName}_M1_{year}.csv'
                csvPath = f'{downloads}/{f}/{base}'
                destination = f'{directoryName}/{year}.csv'
                os.rename(csvPath, destination)

                if os.path.exists(f'{downloads}/{f}'):
                    shutil.rmtree(f'{downloads}/{f}') # one file at a time
            except Exception as e:
                print(e)

s = ["AUDCAD","AUDCHF","AUDJPY","AUDNZD","AUDUSD","AUXAUD","BCOUSD","CADCHF","CADJPY","CHFJPY","ETXEUR","EURAUD","EURCAD","EURCHF","EURCZK","EURDKK","EURGBP","EURHUF","EURJPY","EURNOK","EURNZD","EURPLN","EURSEK","EURTRY","EURUSD","FRXEUR","GBPAUD","GBPCAD","GBPCHF","GBPJPY","GBPNZD","GBPUSD","GRXEUR","HKXHKD","JPXJPY","NSXUSD","NZDCAD","NZDCHF","NZDJPY","NZDUSD","SGDJPY","SPXUSD","UDXUSD","UKXGBP","USDCAD","USDCHF","USDCZK","USDDKK","USDHKD","USDHUF","USDJPY","USDMXN","USDNOK","USDPLN","USDSEK","USDSGD","USDTRY","USDZAR","WTIUSD","XAGUSD","XAUAUD","XAUCHF","XAUEUR","XAUGBP","XAUUSD","ZARJPY"]
for i in s:
    if i == 'EURCHF' or i == "EURGBP" or i == "EURUSD":
        continue
    pairName = i
    # open_download_links()
    # move()
    unzip_all()
