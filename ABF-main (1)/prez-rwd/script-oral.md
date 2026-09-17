# 🎤 SCRIPT ORAL COMPLET — RWD : Desktop vs Smartphone

**Durée totale : ~12 min** (Persona A / Persona B = vous deux, alternez comme vous voulez)
**Règle d'or du prof : des exemples, des screens, des exemples, des screens.**

---

## SLIDE 1 — TITRE (30 sec) — Persona A

> « Bonjour à tous. Aujourd'hui nous allons vous parler du **Responsive Web Design**, ou RWD : la manière dont un site web s'adapte à tous les écrans, de l'ordinateur panoramique au smartphone en portrait. C'est devenu LA norme du web, et on va vous montrer pourquoi, comment ça marche, et surtout avec plein d'exemples. »

---

## SLIDE 2 — DÉFINITION (1 min) — Persona A

> « Commençons par la définition. Un site **responsive**, c'est un site construit avec **une seule page HTML et un seul fichier CSS**, dont la mise en page **s'adapte automatiquement** à la taille de l'écran.
>
> Trois contextes très différents :
>
> - Le **desktop** : un écran large, en mode paysage, navigué à la souris.
> - La **tablette** : un format intermédiaire, tactile.
> - Le **smartphone** : un petit écran en portrait, qu'on navigue avec le pouce d'une seule main.
>
> Le responsive, c'est le même contenu, le même site, qui **se réorganise tout seul** selon l'appareil. Contrairement à ce qu'on faisait avant — et on y viendra — qui était de faire plusieurs sites différents. »

---

## SLIDE 3 — HISTORIQUE (2 min) — Persona B

> « Un peu d'histoire, parce que le responsive ne s'est pas inventé tout seul.
>
> **Avant 2010** : les sites étaient faits en tableaux HTML, avec des largeurs fixes en pixels. Quand les smartphones arrivent, les sites sont illisibles dessus. La solution de l'époque : faire un **deuxième site séparé**, souvent sur une adresse comme **m.site.com**, réservé aux mobiles. Le problème : **deux sites à maintenir**, deux fois plus de travail, et des contenus qui divergent.
>
> **En 2010**, un développeur américain, **Ethan Marcotte**, publie un article resté célèbre sur le site A List Apart, où il invente le terme « Responsive Web Design ». Son idée : **un seul site**, avec trois ingrédients : des **grilles fluides** (en pourcentages, pas en pixels), des **images flexibles**, et les **media queries** CSS — je vous explique dans un instant.
>
> **À partir de 2013**, le framework **Bootstrap** popularise le responsive et le met à la portée de tout le monde.
>
> **En 2015**, Google annonce que le critère « mobile-friendly » influence le référencement : les sites non responsives **descendent** dans les résultats de recherche.
>
> Et **en 2019**, Google passe au **mobile-first indexing** : Googlebot indexe désormais **d'abord la version mobile** d'un site. Autrement dit aujourd'hui, si votre site est mauvais sur mobile, il est mauvais pour Google, point. »

---

## SLIDE 4 — AQUARIUM 1 : L'ANCIENNE MÉTHODE / DESKTOP-FIRST (2 min) — Persona A

⚠️ **LA SLIDE LA PLUS IMPORTANTE, celle que le prof veut absolument voir. Prenez votre temps.**

> « Maintenant, une image pour tout comprendre : **l'aquarium**. 🐠
>
> Pendant longtemps, on a travaillé **desktop d'abord** — en anglais « desktop-first ». On concevait le site **sur l'ordinateur**, on remplissait l'aquarium du desktop avec tout le contenu : textes, images, colonnes, menus… Et l'aquarium desktop, il est très bien : il est grand, tout rentre.
>
> Le problème, c'est quand on essaie de verser **la même eau** — le même contenu, le même design — dans des aquariums plus petits :
>
> - Sur **tablette** : ça **déborde**. Les colonnes se compressent, les images débordent, le menu est trop long.
> - Sur **smartphone** : ça **sur-déborde**. Le site devient une soupe illisible : il faut zoomer avec deux doigts, scroller dans tous les sens.
>
> [MONTRER LE BANDEAU ROUGE sur l'écran] Vous voyez le rouge ? C'est exactement ce qui se passait sur les premiers sites mobiles. Certains d'entre vous s'en souviennent peut-être : ces sites où il fallait pincer l'écran pour agrandir le texte. »

---

## SLIDE 5 — AQUARIUM 2 : MOBILE-FIRST (2 min) — Persona B

⚠️ **LA réponse du prof : « aujourd'hui on travaille plutôt en mobile-first ».**

> « Aujourd'hui, on a inversé la méthode : c'est le **mobile-first** — le mobile d'abord.
>
> On remplit **d'abord le petit aquarium** : le smartphone. Ça veut dire qu'on réfléchit le contenu **en fonction du smartphone et du nombre de scrolls** qu'un utilisateur est prêt à faire. On garde **l'essentiel** : le message principal, l'action importante, quelques scrolls max, dans des proportions raisonnables.
>
> Et ensuite, on **ajoute** :
>
> - Étape 1 : le **smartphone** — le contenu essentiel, calibré au scroll.
> - Étape 2 : la **tablette** — on a plus de place, donc on ajoute du contenu en plus : une colonne de plus, des infos secondaires.
> - Étape 3 : le **desktop** — encore plus de contenu : des colonnes supplémentaires, des visuels plus grands, des éléments de confort.
>
> Donc au lieu de **retrancher** du contenu qui déborde, on **enrichit** un cœur de contenu déjà bien pensé. C'est une philosophie de **conception**, pas juste une technique CSS : ça force à hiérarchiser l'information. C'est LE changement de paradigme du web des dix dernières années. »

---

## SLIDE 6 — TECHNIQUES (2 min) — Persona A (+ DÉMO LIVE)

> « Concrètement, comment le navigateur fait ça ? Trois briques.
>
> **1. Les media queries.** C'est du CSS qui s'applique **conditionnellement** selon la largeur de l'écran. Par exemple ici : en dessous de 768 pixels de large, le menu horizontal est remplacé par le menu burger. Le développeur définit des **breakpoints** — des seuils de largeur — typiquement : mobile, tablette, desktop.
>
> **2. Les unités fluides.** Au lieu de fixer les largeurs en pixels, on utilise des pourcentages, des `rem`, des `vw`… Une image avec `max-width: 100%` ne dépassera jamais son conteneur. Tout se redimensionne proportionnellement.
>
> **3. L'approche mobile-first en CSS.** On écrit le CSS de **base pour le mobile**, puis on ajoute des règles avec `min-width` pour les écrans plus grands. C'est la traduction technique de la slide précédente.
>
> **Et maintenant, la démo live** : on va prendre un vrai site — par exemple [lemonde.fr / apple.com / un site connu] — et on rétrécit la fenêtre du navigateur en direct. Regardez bien : le menu se replie en burger, les colonnes s'empilent, les images se redimensionnent. **C'est ça, le responsive.** »

---

## SLIDE 7 — DESKTOP VS SMARTPHONE : BONNES PRATIQUES (2 min) — Persona B

> « Adapter la mise en page ne suffit pas : les bonnes pratiques changent selon l'appareil.
>
> **Sur desktop** :
>
> - Un **menu horizontal complet** avec tous les liens visibles.
> - Des **colonnes multiples** et des grilles larges qui exploitent l'écran.
> - Le **survol** (hover) est possible — infobulles, effets au survol.
> - Beaucoup de contenu visible **sans scroll**.
>
> **Sur smartphone** :
>
> - Le **menu burger** ☰ : le menu se replie derrière trois petites barres, pour libérer l'écran.
> - **Une seule colonne** : le contenu s'empile verticalement.
> - Les **cibles tactiles** — les boutons, les liens — doivent faire **au moins 44 pixels** : c'est la taille du pouce. Un bouton trop petit, c'est un utilisateur qui rage-quitte.
> - Le contenu est **calibré sur quelques scrolls** — on retrouve l'idée de l'aquarium rempli intelligemment.
> - Les images sont **allégées** pour que le site charge vite, même en 4G.
>
> Un chiffre à retenir : **plus de 60 % du trafic web mondial se fait sur mobile**. Le mobile n'est pas une option, c'est le canal principal. »

---

## SLIDE 8 — RESPONSIVE VS ADAPTIVE (2 min) — Persona A

⚠️ **Le prof demande 80 % responsive / 20 % adaptive — respectez bien ce ratio.**

> « Dernière partie : il ne faut pas confondre responsive et **adaptive** web design. Ce sont **deux écoles différentes**.
>
> **Le responsive** — celui dont on vous a parlé jusqu'ici, et qui représente **environ 80 % du web** :
>
> - **Une seule page** HTML/CSS, avec une mise en page **fluide**.
> - C'est le **navigateur**, chez l'utilisateur, qui adapte l'affichage en temps réel via les media queries.
> - C'est **la norme aujourd'hui**.
>
> **L'adaptive web design** — l'ancienne école, qui existait **avant** le responsive :
>
> - Le serveur **détecte l'appareil** et envoie une **version fixe prédéfinie** : typiquement une version desktop et une version mobile, avec des largeurs fixes.
> - C'est le retour des fameux **m.site.com** de notre slide historique.
> - Et pourtant… **certaines très grandes marques l'utilisent encore**.
>
> **Pourquoi ?** Trois raisons :
>
> 1. **Contrôle total** : chaque version est dessinée séparément, pixel par pixel, sans compromis.
> 2. **Performances maximales** : on n'envoie au mobile QUE ce dont il a besoin — pas de CSS desktop inutile, pas d'images lourdes. Sur des sites à très fort trafic, chaque kilo-octet compte.
> 3. **Des flux métier différents** : la version mobile peut proposer un parcours simplifié.
>
> **Exemple concret** : Amazon. Essayez `amazon.com` sur ordinateur et `m.amazon.com` sur mobile : ce sont deux interfaces réellement différentes, servies par le serveur. C'est de l'adaptive — et ça marche plutôt bien pour eux. »

---

## SLIDE 9 — CONCLUSION (1 min) — Persona B

> « Pour résumer ce qu'il faut retenir :
>
> ✅ Le **responsive** est **la norme** : un seul site, une seule base de code, qui s'adapte à tous les écrans.
>
> ✅ On conçoit désormais en **mobile-first** : l'aquarium — on remplit d'abord le smartphone avec l'essentiel, calibré sur les scrolls, puis on enrichit pour tablette et desktop.
>
> ✅ **Google indexe le mobile en priorité** : pas de responsive = pas de bon référencement = pas de trafic.
>
> ✅ L'**adaptive** survit chez quelques géants comme Amazon, pour des raisons de performance et de contrôle.
>
> En une phrase : **le responsive, c'est un site fluide ; le mobile-first, c'est une façon de penser ; et l'aquarium, c'est la meilleure façon de s'en souvenir.** Merci de votre attention, on répond à vos questions. »

---

## ✅ CHECKLIST FINALE AVANT DE PRÉSENTER

| À faire                                                                                                                         | Pour qui                       |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Ajouter vos 2 prénoms sur la slide 1                                                                                            | Le prof                        |
| Prendre des **screens réels** d'un même site en desktop + tablette + mobile (outil : captures ou mode responsive de Chrome F12) | Slide 2 ou 6 — le prof INSiste |
| Préparer la **démo live** : URL ouverte d'avance, tester le redimensionnement AVANT de passer                                   | Slide 6                        |
| Screens de `amazon.com` vs `m.amazon.com`                                                                                       | Slide 8                        |
| Exporter/partager la prez sur le **Drive** (consigne du prof)                                                                   | Livrable                       |
| Répéter chronométré : visez 10-12 min                                                                                           | Critère « oral »               |

## 💡 QUESTIONS PIÈGES POSSIBLES DU PROF (préparez les réponses)

1. **« C'est quoi un breakpoint ? »** → Un seuil de largeur d'écran (ex : 768px) où le CSS change.
2. **« Comment on teste le responsive sans téléphone ? »** → Les outils de développement du navigateur (F12 → mode appareil).
3. **« Mobile-first, c'est aussi une question de performance ? »** → Oui : charger d'abord le minimum = site plus rapide sur mobile.
4. **« Le responsive remplace-t-il le besoin d'une app mobile ? »** → Non, ce sont des usages différents ; mais pour la plupart des sites, le responsive suffit.
5. **« CSS Grid et Flexbox, c'est responsive ? »** → Oui : ce sont les outils modernes de mise en page fluide (grilles qui se réorganisent sans media queries avec `auto-fit`).
