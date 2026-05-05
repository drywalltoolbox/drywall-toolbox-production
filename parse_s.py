import re
path = 'm0,0 h35 l20,3 l14,4 l11,5 l9,5 l8,7 l7,11 l4,15 l1,11 v29 l-79,1 l-2,-1 v2 l5,1 l19,10 l14,8 l20,13 l11,9 l8,10 l5,10 l4,14 l2,19 v18 l-3,19 l-5,13 l-6,7 l-10,8 l-19,9 l-17,5 l-14,2 h-32 l-18,-2 l-8,-3 l-12,-4 l-12,-6 l-10,-7 l-9,-10 l-6,-16 l-2,-9 v-12 l-2,-4 v-29 h77 l-10,-8 l-15,-8 l-17,-10 l-11,-7 l-10,-9 l-7,-10 l-4,-8 l-3,-12 l-1,-10 v-18 l3,-21 l4,-11 l8,-11 l12,-9 l10,-5 l15,-5 z m12,95 l5,1 l8,7 l4,4 l2,13 v9 l-2,9 l-4,4 h-12 l-2,-8 v-38 z m12,75 l5,1 l8,7 l4,4 l2,13 v9 l-2,9 l-4,4 h-12 l-2,-8 v-38 z'
commands = re.findall(r'[A-Za-z]|-?\d+\.?\d*', path)
pt=[0.0,0.0]; start=None; i=0
while i < len(commands):
    cmd=commands[i]
    if cmd.lower()=='m':
        x=float(commands[i+1]); y=float(commands[i+2]); pt[0]+=x; pt[1]+=y; start=list(pt); print('subpath start', start); i+=3; continue
    if cmd.lower()=='h': pt[0]+=float(commands[i+1]); i+=2; continue
    if cmd.lower()=='v': pt[1]+=float(commands[i+1]); i+=2; continue
    if cmd.lower()=='l': pt[0]+=float(commands[i+1]); pt[1]+=float(commands[i+2]); i+=3; continue
    if cmd.lower()=='z': pt=list(start); i+=1; continue
    i+=1
print('final', pt)
