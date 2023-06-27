import time
import datetime
import os

# <TICKER>,<DTYYYYMMDD>,<TIME>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOL>
# EURUSD,20010102,230100,0.9507,0.9507,0.9507,0.9507,4
pairs = os.listdir('./historicalData')

for pair in pairs:
    if ('.DS_Store' in pair):
        continue
    for file_path in os.listdir(f'./historicalData/{pair}'):
        if ('.csv' not in file_path):
            continue
        file_path = f'./historicalData/{pair}/{file_path}'
        final_res = ''
        completed_already = False
        with open(file_path, 'r') as f:
            lines = f.readlines()
            for i in lines:
                i = i.strip()
                data = i.split(',')
                if len(data) <= 5:
                    completed_already = True
                    continue
                time_data = data[0].split('.')
                year = time_data[0]
                month = time_data[1]
                day = time_data[2]
                s = f'{day}.{month}.{year}'
                res = time.mktime(datetime.datetime.strptime(s, "%d.%m.%Y").timetuple())
                
                time_data = data[1].split(':')
                hours = int(time_data[0])
                mins = int(time_data[1])
                res += 3600 * hours
                res += 60 * mins

                new_line = [data[2], data[3], data[4], data[5], str(int(res))]
                final_res += ",".join(new_line) + '\n'

        if not completed_already:
            with open(file_path, 'w') as f:
                f.write(final_res)
            print(f'Processed {file_path}')
        else:
            print(f'Already Processed {file_path}')

        os.rename(file_path,file_path.replace(' ', ''))
print('All Done!')

