"""Narration track (cues from the timeline) + a synthesised ambient music bed with ducking."""
import json, sys, numpy as np, soundfile as sf
BASE=sys.argv[1]   # the language directory, e.g. dev/video/en; ODIR=BASE+'/out'
from scipy.signal import fftconvolve, resample_poly, butter, sosfilt
SR=48000
T=json.load(open(ODIR+'/timeline.json')); END=T['END']; N=int(END*SR)
# ---------------- narration ----------------
vo=np.zeros(N)
for c in T['cues']:
    a,sr=sf.read(f"{BASE}/vo/{c['sc']}_{c['i']}.wav")
    a=resample_poly(a,SR//sr if SR%sr==0 else SR,1 if SR%sr==0 else sr)
    i=int(c['t']*SR); vo[i:i+len(a)]+=a[:max(0,N-i)]
vo=sosfilt(butter(2,70,'hp',fs=SR,output='sos'),vo)
# gentle presence lift (+2 dB around 3 kHz) by adding a band-passed copy
vo=vo+0.26*sosfilt(butter(2,[2200,4500],'bp',fs=SR,output='sos'),vo)
sf.write(ODIR+'/vo.wav',vo.astype(np.float32),SR)
# ---------------- music bed ----------------
t=np.arange(N)/SR
BPM=84; beat=60/BPM; bar=4*beat; chord_len=2*bar
def hz(m): return 440*2**((m-69)/12)
# D major: Dmaj9 – Bm9 – Gmaj9 – Asus4(add9) ; pads in midi
CH=[[50,57,64,66,69,73],[47,54,61,62,66,69],[43,50,57,59,62,66],[45,52,59,62,64,69]]
ROOT=[38,35,31,33]
L=np.zeros(N);Rr=np.zeros(N)
def env_seg(n,att,rel):
    e=np.ones(n);a=int(att*SR);r=int(rel*SR)
    e[:a]=np.linspace(0,1,a)**1.6; e[-r:]*=np.linspace(1,0,r)**1.3; return e
k=0; start=0.0
rng=np.random.default_rng(3)
while start<END:
    ch=CH[k%4]; seg=int((chord_len+1.6)*SR); i0=int(start*SR); n=min(seg,N-i0)
    if n<=0:break
    tt=np.arange(n)/SR; e=env_seg(n,1.4,1.8)
    for j,m in enumerate(ch):
        f=hz(m)
        for det,pan in ((-0.0035,0.25),(0.0035,0.75)):
            ph=rng.uniform(0,2*np.pi)
            w=sum((0.55**(h-1))/h*np.sin(2*np.pi*f*(1+det)*h*tt+ph*h) for h in range(1,6))
            w*= (0.85+0.15*np.sin(2*np.pi*0.11*tt+j))
            amp=0.05 if m>60 else 0.065
            L[i0:i0+n]+=w*e*amp*(1-pan)*2; Rr[i0:i0+n]+=w*e*amp*pan*2
    # sub bass on beats 1 and 3
    for b in range(4):
        bi=i0+int(b*2*beat*SR); bn=min(int(2*beat*SR),N-bi)
        if bn<=0:break
        bt=np.arange(bn)/SR; be=np.exp(-bt*1.6)*(1-np.exp(-bt*60)); tq=min(bn,int(0.08*SR)); be[-tq:]*=np.linspace(1,0,tq)
        s=np.sin(2*np.pi*hz(ROOT[k%4])*bt)*be*0.13
        L[bi:bi+bn]+=s; Rr[bi:bi+bn]+=s
    start+=chord_len; k+=1
# soft plucked arpeggio (enters after the intro reveal)
arp_from=T['S']['map'][0]-1.0
step=beat/2; idx=0; tp=arp_from
while tp<END-2.5:
    kk=int(tp//chord_len)%4; ch=CH[kk]; pat=[0,2,3,4,5,4,3,2]; m=ch[pat[idx%8]]+12
    i=int(tp*SR); n=min(int(0.9*SR),N-i); bt=np.arange(n)/SR
    s=(np.sin(2*np.pi*hz(m)*bt)+0.25*np.sin(4*np.pi*hz(m)*bt))*np.exp(-bt*5.5)*(1-np.exp(-bt*400))*0.045
    pan=0.35 if idx%2 else 0.65; L[i:i+n]+=s*(1-pan)*2; Rr[i:i+n]+=s*pan*2
    idx+=1; tp+=step
mus=np.stack([L,Rr],1)
mus=sosfilt(butter(2,5200,'lp',fs=SR,output='sos'),mus,axis=0)
# reverb: decorrelated exponential noise tails
ir_n=int(2.4*SR); irt=np.arange(ir_n)/SR
irL=rng.standard_normal(ir_n)*np.exp(-irt*2.6); irR=rng.standard_normal(ir_n)*np.exp(-irt*2.6)
irL/=np.sqrt((irL**2).sum()); irR/=np.sqrt((irR**2).sum())
wet=np.stack([fftconvolve(mus[:,0],irL)[:N],fftconvolve(mus[:,1],irR)[:N]],1)
mus=0.72*mus+0.42*wet
# fades: in over 2 s, out over the last 2.2 s
f=np.ones(N); a=int(2.0*SR); f[:a]=np.linspace(0,1,a)**2; r=int(2.2*SR); f[-r:]=np.linspace(1,0,r)**1.5
mus*=f[:,None]
# ducking from the narration envelope (≈ -9 dB under the voice, 120 ms attack, 600 ms release)
env=np.abs(vo); win=int(0.03*SR); env=np.convolve(env,np.ones(win)/win,'same')
act=(env>0.01).astype(float); g=np.empty(N); cur=0.0
aa=1-np.exp(-1/(0.12*SR)); rr=1-np.exp(-1/(0.6*SR))
for i in range(N):
    x=act[i]; cur+= (aa if x>cur else rr)*(x-cur); g[i]=cur
duck=10**(-9*g/20)
mus*=duck[:,None]
sf.write(ODIR+'/music.wav',mus.astype(np.float32),SR)
print('ok',END,'music peak',np.abs(mus).max(),'vo peak',np.abs(vo).max())
