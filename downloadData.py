import pathlib
import webbrowser
import os
import time

home = pathlib.Path().home()
downloads = f'{home}/Downloads'


pairName = 'EURUSD'

def open_download_links():
    print(f"Opening Downloads for {pairName}")
    for i in range(2000, 2023):
        base_URL = f'https://www.histdata.com/download-free-forex-historical-data/?/metatrader/1-minute-bar-quotes/{pairName.lower()}/{i}'
        webbrowser.open_new(base_URL)

# HISTDATA_COM_MT_EURUSD_M12022.zip
def move_zips():
    files = os.listdir(downloads)

    # unzip all files
    for f in files:
        if f'HISTDATA_COM_MT_{pairName}_M1' in f and '.zip' in f:
            os.system(f'open {downloads}/{f}')
    
    time.sleep(3)


    # create div if it doesnt exist
    directoryName = f'./historicalData/{pairName}'
    if not os.path.exists(f'./historicalData/{pairName}'):
        os.makedirs(directoryName)

    # find all and move to project 
    files = os.listdir(downloads)
    for f in files:
        if f'HISTDATA_COM_MT_{pairName}_M1' in f and '.zip' not in f:
            year = f[-4:]
            base = f'DAT_MT_{pairName}_M1_{year}.csv'
            csvPath = f'{downloads}/{f}/{base}'
            destination = f'{directoryName}/{year}.csv'
            os.rename(csvPath, destination)

move_zips()
# open_download_links()