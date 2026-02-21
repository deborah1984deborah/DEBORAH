# DEBORAH System Overview & Basic Design

[日本語版](#deborah-システム-基本設計概要資料-japanese-version)

## 1. Introduction

DEBORAH is fundamentally a "novel creation tool". It is designed to comprehensively support the entire process of writing a novel using the power of AI, from building the world setting and characters to the actual writing of the story, as well as providing assistance and consultation during the writing process.

## 2. Architecture

The DEBORAH system is composed of two major functional blocks: **MOMMY** and **WOMB**.

### 2.1. MOMMY (World & Entity Management)

MOMMY is a tool for creating and managing the foundational information that forms the base of the story's world. It creates and systematically manages three types of "Entities":

- **Fuckmeat (Mommy)**
- **Penis (Nerd)**
- **Lore**

These function as the foundational data components for character profiles (attributes/traits), world-building, and terminology.

### 2.2. WOMB (Story Creation & Writing Support)

WOMB is the main tool used to actually create and write the story. It builds the narrative based on the Entity information received from MOMMY. Functionally, WOMB is further divided into two core components: **WOMB** and **CORD**.

- **WOMB**: The core function that actually generates the text of the story.
- **CORD**: An assistant function that helps with research for the story and acts as a consultant for settings and plot development.

---

## 3. The Core Feature: Advanced Integration of WOMB and CORD

While the concept of creating and managing prerequisite knowledge is common in other AI-assisted writing tools, **one of DEBORAH's absolute defining features is the tight integration between WOMB and CORD**.

### 3.1. Dynamic Tracking via History Function

DEBORAH features a "History" function that records changes and milestones that occur to Entities within each story. **CORD automatically generates and updates this history** as the story progresses.

### 3.2. Context Optimization by CORD

In typical AI writing applications, registered information (like Entities) is simply passed to the generative AI in response to predefined keywords. In DEBORAH, CORD performs a much more sophisticated intermediary step:

1. **Information Culling**: CORD interprets the current situation of the story and selectively filters the information that needs to be passed to WOMB.
2. **Synthesis and Editing**: It synthesizes the selected information with other relevant context, **compiling it into the most appropriate format for WOMB to accurately depict the scene**.

By acting as a "brilliant editor and assistant" that bridges this information gap, CORD enables WOMB to generate highly accurate and contextually rich descriptions.

---

## 4. Current Implementation Status (Unimplemented Features)

The following features are established in the core design but are currently under development or planned for future updates:

- **Automatic History Generation/Updating by CORD**: The functionality where CORD automatically tracks and records changes or states of Entities as the story progresses. *(Currently designed, but not yet implemented.)*
- **Context Optimization by CORD**: The advanced intermediary step where CORD interprets the story situation, selectively filters information, and synthesizes it into the optimal format before passing it to WOMB. *(Currently designed, but not yet implemented.)*

---

## 5. Long-Term Vision & Roadmap

The ultimate goal for DEBORAH is to evolve beyond a text-based novel creation tool and become a comprehensive **Video Game Creation Studio** (or function as an interactive video game itself). Future major expansions will integrate various generative AI models directly into the creative pipeline:

- **AI Image Generation**: Automatically generating character portraits, background CGs, and item illustrations based on Entity data and story context.
- **AI Video Generation**: Creating dynamic cutscenes and animated sequences to bring the story to life.
- **3D Model Generation**: Generating 3D assets to build fully realized, interactive worlds.

<br>
<hr>
<br>

<a id="japanese"></a>

# DEBORAH システム 基本設計・概要資料 (Japanese Version)

## 1. アプリケーション概要

DEBORAHは、大まかにいえば「ノベル作成ツール」です。世界観やキャラクターの構築から実際の物語の執筆、さらには執筆時の設定相談やサポートまで、小説執筆における一連のプロセスをAIの力で総合的に支援するシステムとして設計されています。

## 2. システム構成

DEBORAHシステムは大きく分けて「**MOMMY**」と「**WOMB**」という2つの主要機能ブロックで構成されています。

### 2.1. MOMMY (世界観・エンティティ作成管理機能)

MOMMYは物語の世界観のベースとなる情報を作成し、管理するためのツールです。MOMMYは以下の3種類の「Entity（エンティティ）」を作成し、体系的に管理します。

- **Fuckmeat (Mommy)**
- **Penis (Nerd)**
- **Lore**

これらはキャラクター設定（属性・特性）や世界観・用語解説などの基盤となるデータ構成要素として機能します。

### 2.2. WOMB (物語作成・執筆支援機能)

実際に物語を作成・執筆するためのメインツールです。MOMMYから受け取ったEntityの情報をベースにして物語を構築します。機能の役割として、WOMBは内部でさらに**「WOMB」**本機能と**「CORD」**に分かれています。

- **WOMB**: 物語の本文を実際に作成するコア機能。
- **CORD**: 物語を作るための調べ物を助けたり、設定や展開についての相談相手となる機能。

---

## 3. DEBORAHの最大の特徴：「WOMB」と「CORD」の高度な連携

前提知識を事前に作成し管理する機能自体は、他のAIを活用した文書作成ツールにも見られるアプローチですが、**DEBORAHの最大の特徴の一つは「WOMB」と「CORD」の密接な連携**にあります。

### 3.1. ヒストリー機能による動的な変化の記録

各ストーリー内でEntityに起きた変化や状態を記録していく「ヒストリー」機能を備えています。物語の進行に合わせて、**CORDが自動的にこのヒストリーを作成・更新します**。

### 3.2. CORDによるコンテキストの最適化

一般的なAI文書アプリケーションでは、設定されたキーワードに反応して単純に登録された情報（Entity）を生成AIに渡すアプローチが主流です。一方DEBORAHでは、CORDが一段階高度な処理を挟みます。

1. **情報選別**: CORDが現在の物語の状況に合わせて、WOMBに渡す情報をさらに取捨選択・選別します。
2. **情報の総合と編集**: 選別した情報を他の関連するコンテキストと総合し、**WOMBが状況を描写するために最も適した情報としてまとめてから渡す**役割を担います。

このように、CORDが「優秀な編集者・アシスタント」として情報の橋渡しを行うことで、WOMBはより高い精度で文脈に沿った豊かな描写を行うことが可能になります。

---

## 4. 現在の未実装機能（開発予定）

以下の機能は基本設計およびコンセプトに組み込まれていますが、現在は未実装（今後のアップデートで実装予定）となります。

- **CORDによるヒストリーの自動作成・更新**: 物語の進行に合わせて、Entityの歴史や状態の変化を全自動で記録・追跡する機能。
- **CORDによるコンテキストの最適化**: CORDが物語の状況を解釈し、WOMBに渡すべき情報を取捨選択・総合して最適な形で渡す機能。（現在は通常のキーワード反応に近い形ですが、将来的にはこの高度な連携が実装されます）

---

## 5. 長期的な展望とロードマップ

DEBORAHの最終的な野望は、単なるテキストベースの「ノベル作成ツール」の枠を超え、それ自体が**ある種のビデオゲーム**、あるいは**ビデオゲームの総合制作環境**へと進化することです。
今後の長期的な展開として、テキスト生成に留まらず、様々な生成AIモデルをシステムに統合していく予定です。

- **AIによる画像生成**: Entityのデータや物語の状況（コンテキスト）に基づいた、キャラクターの立ち絵・背景CG・スチルイラストなどの自動生成機能。
- **AIによる動画生成**: 動的なカットシーンやイベントアニメーションの生成機能。
- **3Dモデル生成**: 構築した世界観を完全にインタラクティブなゲームへと昇華させるための3Dアセットの生成機能。
