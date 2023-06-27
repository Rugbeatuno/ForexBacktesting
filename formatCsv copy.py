import time
import datetime
import os

# <TICKER>,<DTYYYYMMDD>,<TIME>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOL>
# EURUSD,20010102,230100,0.9507,0.9507,0.9507,0.9507,4
pairs = os.listdir('./historicalData')

for pair in pairs:
    file_path = f'./historicalData/{pair}'

    final_res = ''
    with open(file_path, 'r') as f:
        lines = f.readlines()
        for i in lines:
            i = i.strip()
            data = i.split(',')
            if len(data) <= 5:
                # print(f'{file_path} already formatted!')
                continue
            year = data[1][:4]
            month = data[1][4:6]
            day = data[1][6:]
            s = f'{day}.{month}.{year}'
            res = time.mktime(datetime.datetime.strptime(s, "%d.%m.%Y").timetuple())
            hours = int(data[2][:2])
            mins = int(data[2][2:4])
            res += 3600 * hours
            res += 60 * mins

            new_line = [data[3], data[4], data[5], data[6], str(int(res))]
            final_res += ",".join(new_line) + '\n'

    with open(file_path, 'w') as f:
        f.write(final_res)
    print(f'Processed {file_path}')
print('All Done!')
