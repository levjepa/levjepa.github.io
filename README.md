# LeVJEPA

Project page for **LeVJEPA: Efficient & Scalable Video Pretraining without the
Heuristics** — <https://levjepa.github.io>

- Paper: <https://arxiv.org/abs/2608.27395>
- Code: <https://github.com/galilai-group/levjepa>
- Checkpoints: <https://huggingface.co/galilai-group/LeVJEPA-VideoMix-Large>

## Layout

```
index.html              the page (content + a small amount of page CSS)
static/css/article.css  type, palette and the margin-column layout
static/js/figures.js    gutter layout, interactive figures, comparison sliders
static/images/          figure exports and the input/PCA comparison pairs
static/videos/          patch-token visualizations
```

Serve locally with `python3 -m http.server`.

Note: `article.css` and `figures.js` are referenced with `?v=` cache-busting
parameters in `index.html`. Bump them when editing either file.

## Citation

```bibtex
@misc{kuhn2026levjepaefficientscalable,
      title={LeVJEPA: Efficient & Scalable Video Pretraining without the Heuristics}, 
      author={Lukas Kuhn and Lucas Maes and Giuseppe Serra and Quentin Le Lidec and Yann LeCun and Randall Balestriero and Florian Buettner},
      year={2026},
      eprint={2608.27395},
      archivePrefix={arXiv},
      primaryClass={cs.CV},
      url={https://arxiv.org/abs/2608.27395}, 
}
```
