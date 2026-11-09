"""Narration, one WAV per sentence, with Kokoro (kokoro-onnx).  tts.py <lang dir> <voice> <espeak language> [scene_i,…]
   e.g. tts.py dev/video/en af_heart en-us  ·  tts.py dev/video/fr ff_siwis fr-fr  ·  only some sentences: … intro_0,map_2
   Model files: $KOKORO_MODEL / $KOKORO_VOICES, else dev/video/tts/model_q8.onnx and voices.bin (not in git).
   Words in FIX are spoken from the given phonemes."""
import json, re, sys, soundfile as sf
from kokoro_onnx import Kokoro
from kokoro_onnx.tokenizer import Tokenizer
D,VOICE,LANG=sys.argv[1],sys.argv[2],sys.argv[3]
FIX={'en-us':{'F-TEIDs':'ˈɛf tˈiːdz','V-LAN':'vˈiː læn'},
     'fr-fr':{'Mobile Network Navigator':'mobˈajl nɛtwˈœʁk naviɡɛjtˈœʁ','Wireshark':'wajʁʃˈaʁk','Diameter':'djamɛtˈœʁ','les F-TEID':'lez ɛf tˈɛjd','F-TEID':'ɛf tˈɛjd',
              'VLAN':'velˈan','handover':'ɑndovˈœʁ','AES-256':'a ə ˈɛs døsɑ̃ sɛ̃kɑ̃tsˈis','NAS':'nˈas'}}.get(LANG,{})
import os
TD=os.path.join(os.path.dirname(os.path.abspath(__file__)),'tts')
k=Kokoro(os.environ.get('KOKORO_MODEL',os.path.join(TD,'model_q8.onnx')),os.environ.get('KOKORO_VOICES',os.path.join(TD,'voices.bin'))); tok=Tokenizer()
def phon(s):
    if not FIX: return None
    pat=re.compile('|'.join(re.escape(w) for w in sorted(FIX,key=len,reverse=True))+r'(?![\w-])')
    parts=[];last=0
    for m in pat.finditer(s):
        parts.append(('t',s[last:m.start()]));parts.append(('p',FIX[m.group(0)]));last=m.end()
    if not parts: return None
    parts.append(('t',s[last:]))
    out=[]
    for t,x in parts:
        if t=='p': out.append(x)
        elif x.strip():
            ph=tok.phonemize(x,LANG).strip()
            # keep the punctuation that ends a text chunk (espeak drops a leading one)
            if x.strip()[0] in ',.:;?!' and not ph.startswith(x.strip()[0]): ph=x.strip()[0]+' '+ph
            out.append(ph)
    return ' '.join(out)
os.makedirs(f'{D}/vo',exist_ok=True)
N=json.load(open(f'{D}/narration.json'));ONLY=sys.argv[4].split(',') if len(sys.argv)>4 else None
import os;dur=json.load(open(f'{D}/vo/durations.json')) if ONLY and os.path.exists(f'{D}/vo/durations.json') else {}
for sc,sents in N:
    for i,s in enumerate(sents):
        if ONLY and f'{sc}_{i}' not in ONLY: continue
        p=phon(s)
        a,sr=(k.create(p,voice=VOICE,speed=1.0,is_phonemes=True) if p else k.create(s,voice=VOICE,speed=1.0,lang=LANG))
        sf.write(f'{D}/vo/{sc}_{i}.wav',a,sr);dur[f'{sc}_{i}']=len(a)/sr;print(sc,i,round(len(a)/sr,2),'| '+(p or '')[:90],flush=True)
json.dump(dur,open(f'{D}/vo/durations.json','w'),indent=1);print('DONE',round(sum(dur.values()),1))
